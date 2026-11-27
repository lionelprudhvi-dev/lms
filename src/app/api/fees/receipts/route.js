import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const studentId = searchParams.get('studentId');

    let sql = `
      SELECT r.*,
             c.name as company_name, c.code as company_code,
             s.student_id_code, s.email,
             p.reference_number
      FROM payment_receipts r
      JOIN companies c ON c.id = r.company_id
      JOIN students s ON s.id = r.student_id
      JOIN fee_payments p ON p.id = r.payment_id
      WHERE r.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (auth.user.user_type === 'student' && auth.user.student) {
      params.push(auth.user.student.id);
      sql += ` AND r.student_id = $${params.length}`;
    } else if (studentId) {
      params.push(studentId);
      sql += ` AND r.student_id = $${params.length}`;
    }

    if (companyId) {
      params.push(companyId);
      sql += ` AND r.company_id = $${params.length}`;
    }

    sql += ` ORDER BY r.payment_date DESC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
