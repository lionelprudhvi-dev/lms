import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const companyId = searchParams.get('companyId');
    const courseId = searchParams.get('courseId');
    const batchId = searchParams.get('batchId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    let sql = `
      SELECT a.*,
             s.full_name as student_name, s.student_id_code,
             c.name as company_name, c.code as company_code,
             cr.name as course_name,
             b.name as batch_name
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN companies c ON c.id = a.company_id
      LEFT JOIN courses cr ON cr.id = a.course_id
      LEFT JOIN batches b ON b.id = a.batch_id
      WHERE a.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (date) {
      params.push(date);
      sql += ` AND a.date = $${params.length}`;
    }

    if (companyId) {
      params.push(companyId);
      sql += ` AND a.company_id = $${params.length}`;
    } else if (!auth.user.isOrgAdmin) {
      sql += ` AND a.company_id IN (SELECT company_id FROM user_company_access WHERE user_id = '${auth.user.id}')`;
    }

    if (courseId) {
      params.push(courseId);
      sql += ` AND a.course_id = $${params.length}`;
    }

    if (batchId) {
      params.push(batchId);
      sql += ` AND a.batch_id = $${params.length}`;
    }

    if (studentId) {
      params.push(studentId);
      sql += ` AND a.student_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND a.status = $${params.length}`;
    }

    sql += ` ORDER BY a.date DESC, a.check_in_time DESC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
