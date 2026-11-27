import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    let sql = `
      SELECT cr.*,
             c.name as company_name, c.code as company_code,
             COUNT(DISTINCT b.id) as batch_count,
             COUNT(DISTINCT ce.student_id) as enrolled_student_count,
             COUNT(DISTINCT cm.id) as module_count
      FROM courses cr
      JOIN companies c ON c.id = cr.company_id
      LEFT JOIN batches b ON b.course_id = cr.id
      LEFT JOIN course_enrollments ce ON ce.course_id = cr.id
      LEFT JOIN course_modules cm ON cm.course_id = cr.id
      WHERE cr.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (companyId) {
      params.push(companyId);
      sql += ` AND cr.company_id = $${params.length}`;
    } else if (!auth.user.isOrgAdmin) {
      sql += ` AND cr.company_id IN (SELECT company_id FROM user_company_access WHERE user_id = '${auth.user.id}')`;
    }

    sql += ` GROUP BY cr.id, c.name, c.code ORDER BY cr.created_at DESC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'courses.create' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { name, code, company_id, category = 'Technology', description, duration_weeks = 12, total_hours = 120, base_fee = 0, mode = 'classroom' } = body;

    if (!name || !code || !company_id) {
      return jsonError('Course name, unique code, and company are required', 400);
    }

    const insRes = await query(
      `INSERT INTO courses (organization_id, company_id, name, code, description, category, duration_weeks, total_hours, base_fee, mode, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
       RETURNING *`,
      [auth.user.organization_id, company_id, name, code.toUpperCase(), description, category, duration_weeks, total_hours, base_fee, mode]
    );

    return jsonSuccess(insRes.rows[0], 'Course created successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
