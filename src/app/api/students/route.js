import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query, transaction } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const courseId = searchParams.get('courseId');
    const batchId = searchParams.get('batchId');

    let sql = `
      SELECT s.*, 
             c.name as company_name, c.code as company_code,
             cr.id as course_id, cr.name as course_name,
             b.id as batch_id, b.name as batch_name,
             sfa.outstanding_balance, sfa.total_paid, sfa.status as fee_status
      FROM students s
      JOIN companies c ON c.id = s.company_id
      LEFT JOIN course_enrollments ce ON ce.student_id = s.id
      LEFT JOIN courses cr ON cr.id = ce.course_id
      LEFT JOIN batches b ON b.id = ce.batch_id
      LEFT JOIN student_fee_accounts sfa ON sfa.student_id = s.id
      WHERE s.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (companyId) {
      params.push(companyId);
      sql += ` AND s.company_id = $${params.length}`;
    } else if (!auth.user.isOrgAdmin) {
      sql += ` AND s.company_id IN (SELECT company_id FROM user_company_access WHERE user_id = '${auth.user.id}')`;
    }

    if (courseId) {
      params.push(courseId);
      sql += ` AND cr.id = $${params.length}`;
    }

    if (batchId) {
      params.push(batchId);
      sql += ` AND b.id = $${params.length}`;
    }

    sql += ` ORDER BY s.created_at DESC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'students.create' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const {
      full_name,
      email,
      phone,
      company_id,
      course_id,
      batch_id,
      dob,
      gender,
      address,
      qualification,
      emergency_contact,
      status = 'active',
      create_user = true,
      password = 'Password@123',
    } = body;

    if (!full_name || !email || !company_id) {
      return jsonError('Student name, email, and company assignment are required', 400);
    }

    // Auto-generate unique Student ID: STU-YYYY-RANDOM
    const studentIdCode = `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await transaction(async ({ query: q }) => {
      let createdUserId = null;

      if (create_user) {
        const passwordHash = await bcrypt.hash(password, 10);
        const userRes = await q(
          `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, user_type)
           VALUES ($1, $2, $3, $4, $5, $6, 'student')
           ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
           RETURNING id`,
          [auth.user.organization_id, email.toLowerCase().trim(), passwordHash, full_name.split(' ')[0], full_name.split(' ').slice(1).join(' ') || 'Student', phone]
        );
        createdUserId = userRes.rows[0].id;

        // Assign student role
        await q(
          `INSERT INTO user_roles (user_id, role_id)
           SELECT $1, id FROM roles WHERE code = 'STUDENT' AND organization_id = $2
           ON CONFLICT DO NOTHING`,
          [createdUserId, auth.user.organization_id]
        );

        // Assign company access
        await q(
          `INSERT INTO user_company_access (user_id, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [createdUserId, company_id]
        );
      }

      // Insert Student
      const stuRes = await q(
        `INSERT INTO students (
          user_id, organization_id, company_id, student_id_code, full_name, email, phone, dob, gender, address, qualification, emergency_contact, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [createdUserId, auth.user.organization_id, company_id, studentIdCode, full_name, email, phone, dob || null, gender || null, address || null, qualification || null, emergency_contact || null, status]
      );
      const student = stuRes.rows[0];

      // If course/batch provided, enroll student
      if (course_id) {
        await q(
          `INSERT INTO course_enrollments (organization_id, company_id, student_id, course_id, batch_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (student_id, course_id) DO UPDATE SET batch_id = EXCLUDED.batch_id`,
          [auth.user.organization_id, company_id, student.id, course_id, batch_id || null]
        );

        if (batch_id) {
          await q(
            `INSERT INTO batch_students (batch_id, student_id)
             VALUES ($1, $2)
             ON CONFLICT (batch_id, student_id) DO NOTHING`,
            [batch_id, student.id]
          );
        }

        // Create student fee account from fee structure or course base fee
        const fsRes = await q(
          `SELECT * FROM fee_structures WHERE course_id = $1 AND (batch_id = $2 OR batch_id IS NULL) AND status = 'active' ORDER BY batch_id NULLS LAST LIMIT 1`,
          [course_id, batch_id || null]
        );

        let baseFee = 35000;
        let feeStructureId = null;

        if (fsRes.rows.length > 0) {
          baseFee = Number(fsRes.rows[0].total_fee);
          feeStructureId = fsRes.rows[0].id;
        } else {
          const cRes = await q(`SELECT base_fee FROM courses WHERE id = $1`, [course_id]);
          if (cRes.rows.length > 0 && cRes.rows[0].base_fee) {
            baseFee = Number(cRes.rows[0].base_fee);
          }
        }

        const feeAccRes = await q(
          `INSERT INTO student_fee_accounts (
            organization_id, company_id, student_id, fee_structure_id, course_id, batch_id, base_fee, net_payable, outstanding_balance, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $7, 'pending')
          ON CONFLICT (student_id) DO NOTHING
          RETURNING id`,
          [auth.user.organization_id, company_id, student.id, feeStructureId, course_id, batch_id || null, baseFee]
        );

        if (feeAccRes.rows.length > 0) {
          const accId = feeAccRes.rows[0].id;
          // Create default 2 installments
          const half = Math.round(baseFee / 2);
          await q(
            `INSERT INTO fee_installments (student_fee_account_id, installment_number, title, due_amount, due_date, status)
             VALUES 
             ($1, 1, 'Installment 1 (Registration)', $2, CURRENT_DATE + interval '7 days', 'pending'),
             ($1, 2, 'Installment 2 (Tuition Balance)', $3, CURRENT_DATE + interval '30 days', 'pending')`,
            [accId, half, baseFee - half]
          );
        }
      }

      return student;
    });

    return jsonSuccess(result, 'Student created and enrolled successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
