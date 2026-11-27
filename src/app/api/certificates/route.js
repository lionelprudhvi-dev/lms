import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query, transaction } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const studentId = searchParams.get('studentId');

    let sql = `
      SELECT cert.*,
             c.name as company_name, c.code as company_code,
             s.student_id_code,
             cr.name as course_name
      FROM certificates cert
      JOIN companies c ON c.id = cert.company_id
      JOIN students s ON s.id = cert.student_id
      JOIN courses cr ON cr.id = cert.course_id
      WHERE cert.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (auth.user.user_type === 'student' && auth.user.student) {
      params.push(auth.user.student.id);
      sql += ` AND cert.student_id = $${params.length}`;
    } else if (studentId) {
      params.push(studentId);
      sql += ` AND cert.student_id = $${params.length}`;
    }

    if (companyId) {
      params.push(companyId);
      sql += ` AND cert.company_id = $${params.length}`;
    }

    sql += ` ORDER BY cert.issue_date DESC, cert.created_at DESC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'certificates.create' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { student_id, course_id, template_id, completion_date = new Date().toISOString().split('T')[0] } = body;

    if (!student_id || !course_id) {
      return jsonError('Student and course are required to issue certificate', 400);
    }

    // Check fee clearance rule
    const orgSettings = await query(
      `SELECT rules FROM organization_settings WHERE organization_id = $1`,
      [auth.user.organization_id]
    );
    const rules = orgSettings.rows[0]?.rules || {};
    if (rules.block_certificate_on_unpaid) {
      const feeRes = await query(
        `SELECT outstanding_balance, status FROM student_fee_accounts WHERE student_id = $1`,
        [student_id]
      );
      if (feeRes.rows.length > 0 && Number(feeRes.rows[0].outstanding_balance) > 0) {
        return jsonError(
          `Cannot Issue Certificate: Student has an outstanding fee balance of ₹${Number(feeRes.rows[0].outstanding_balance).toLocaleString()}. 100% fee clearance is required per policy.`,
          403
        );
      }
    }

    // Fetch student & course
    const stuRes = await query(
      `SELECT s.id, s.full_name, s.company_id, c.name as course_name
       FROM students s, courses c
       WHERE s.id = $1 AND c.id = $2`,
      [student_id, course_id]
    );

    if (stuRes.rows.length === 0) {
      return jsonError('Student or course details not found', 404);
    }
    const { full_name: studentName, company_id: companyId, course_name: courseName } = stuRes.rows[0];

    // Generate unique Certificate Number: APEX-CERT-YYYY-RANDOM
    const certNumber = `APEX-CERT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const qrCodeData = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${certNumber}`;

    const insRes = await query(
      `INSERT INTO certificates (
        organization_id, company_id, student_id, course_id, template_id,
        certificate_number, student_name, course_name, completion_date, issue_date, qr_code_data, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, $10, 'valid')
      RETURNING *`,
      [auth.user.organization_id, companyId, student_id, course_id, template_id || null, certNumber, studentName, courseName, completion_date, qrCodeData]
    );

    return jsonSuccess(insRes.rows[0], 'Certificate generated and registered successfully!', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
