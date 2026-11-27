import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const companyId = searchParams.get('companyId');

    let sql = `
      SELECT m.*,
             sa.full_name as student_a_name, sa.student_id_code as student_a_code,
             sb.full_name as student_b_name, sb.student_id_code as student_b_code,
             c.name as company_name, c.code as company_code,
             b.name as batch_name,
             u.first_name as reviewer_first_name, u.last_name as reviewer_last_name
      FROM attendance_ip_matches m
      JOIN students sa ON sa.id = m.student_a_id
      JOIN students sb ON sb.id = m.student_b_id
      JOIN companies c ON c.id = m.company_id
      LEFT JOIN batches b ON b.id = m.batch_id
      LEFT JOIN users u ON u.id = m.reviewed_by
      WHERE m.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (status) {
      params.push(status);
      sql += ` AND m.status = $${params.length}`;
    }

    if (companyId) {
      params.push(companyId);
      sql += ` AND m.company_id = $${params.length}`;
    }

    sql += ` ORDER BY m.created_at DESC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
