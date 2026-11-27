import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const companyId = searchParams.get('companyId');

    let sql = `
      SELECT er.*,
             e.name as exam_name, e.code as exam_code, e.passing_marks,
             s.full_name as student_name, s.student_id_code,
             c.name as company_name,
             cr.name as course_name,
             b.name as batch_name
      FROM exam_results er
      JOIN examinations e ON e.id = er.exam_id
      JOIN students s ON s.id = er.student_id
      JOIN companies c ON c.id = e.company_id
      JOIN courses cr ON cr.id = e.course_id
      LEFT JOIN batches b ON b.id = e.batch_id
      WHERE e.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (auth.user.user_type === 'student' && auth.user.student) {
      params.push(auth.user.student.id);
      sql += ` AND er.student_id = $${params.length}`;
    }

    if (examId) {
      params.push(examId);
      sql += ` AND er.exam_id = $${params.length}`;
    }

    if (companyId) {
      params.push(companyId);
      sql += ` AND e.company_id = $${params.length}`;
    }

    sql += ` ORDER BY er.created_at DESC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
