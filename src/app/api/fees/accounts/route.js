import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');

    let sql = `
      SELECT sfa.*,
             s.full_name as student_name, s.student_id_code, s.email, s.phone,
             c.name as company_name, c.code as company_code,
             cr.name as course_name,
             b.name as batch_name,
             COALESCE(
               json_agg(
                 jsonb_build_object(
                   'id', fi.id,
                   'number', fi.installment_number,
                   'title', fi.title,
                   'due_amount', fi.due_amount,
                   'due_date', fi.due_date,
                   'paid_amount', fi.paid_amount,
                   'status', fi.status
                 ) ORDER BY fi.installment_number ASC
               ) FILTER (WHERE fi.id IS NOT NULL), '[]'
             ) as installments
      FROM student_fee_accounts sfa
      JOIN students s ON s.id = sfa.student_id
      JOIN companies c ON c.id = sfa.company_id
      LEFT JOIN courses cr ON cr.id = sfa.course_id
      LEFT JOIN batches b ON b.id = sfa.batch_id
      LEFT JOIN fee_installments fi ON fi.student_fee_account_id = sfa.id
      WHERE sfa.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (auth.user.user_type === 'student' && auth.user.student) {
      params.push(auth.user.student.id);
      sql += ` AND sfa.student_id = $${params.length}`;
    }

    if (companyId) {
      params.push(companyId);
      sql += ` AND sfa.company_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND sfa.status = $${params.length}`;
    }

    sql += ` GROUP BY sfa.id, s.full_name, s.student_id_code, s.email, s.phone, c.name, c.code, cr.name, b.name ORDER BY sfa.created_at DESC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
