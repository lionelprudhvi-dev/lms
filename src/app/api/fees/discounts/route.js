import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query, transaction } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const res = await query(
      `SELECT fd.*,
              s.full_name as student_name, s.student_id_code,
              c.name as company_name,
              u.first_name as approver_first_name, u.last_name as approver_last_name
       FROM fee_discounts fd
       JOIN student_fee_accounts sfa ON sfa.id = fd.student_fee_account_id
       JOIN students s ON s.id = sfa.student_id
       JOIN companies c ON c.id = fd.company_id
       LEFT JOIN users u ON u.id = fd.approved_by
       WHERE fd.organization_id = $1
       ORDER BY fd.created_at DESC`,
      [auth.user.organization_id]
    );

    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'discounts.create' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { student_id, discount_type = 'scholarship', discount_value, reason } = body;

    const val = Number(discount_value);
    if (!student_id || !val || val <= 0 || !reason) {
      return jsonError('Student, valid discount amount, and reason are required', 400);
    }

    const created = await transaction(async ({ query: q }) => {
      const accRes = await q(
        `SELECT id, organization_id, company_id, base_fee, total_discount, net_payable, outstanding_balance
         FROM student_fee_accounts WHERE student_id = $1 AND organization_id = $2`,
        [student_id, auth.user.organization_id]
      );

      if (accRes.rows.length === 0) throw new Error('Student fee account not found');
      const acc = accRes.rows[0];

      // Insert discount
      const discRes = await q(
        `INSERT INTO fee_discounts (
          organization_id, company_id, student_fee_account_id, discount_type,
          discount_value, calculated_amount, reason, status, approved_by, approved_at
        ) VALUES ($1, $2, $3, $4, $5, $5, $6, 'approved', $7, CURRENT_TIMESTAMP)
        RETURNING *`,
        [acc.organization_id, acc.company_id, acc.id, discount_type, val, reason, auth.user.id]
      );

      // Adjust fee account
      const newTotalDiscount = Number(acc.total_discount) + val;
      const newNetPayable = Math.max(0, Number(acc.net_payable) - val);
      const newOutstanding = Math.max(0, Number(acc.outstanding_balance) - val);

      await q(
        `UPDATE student_fee_accounts
         SET total_discount = $1,
             net_payable = $2,
             outstanding_balance = $3,
             status = CASE WHEN $3 = 0 THEN 'paid' ELSE status END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [newTotalDiscount, newNetPayable, newOutstanding, acc.id]
      );

      return discRes.rows[0];
    });

    return jsonSuccess(created, 'Fee discount and scholarship concession applied successfully!', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
