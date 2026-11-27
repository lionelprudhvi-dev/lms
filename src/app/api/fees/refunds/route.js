import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query, transaction } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const res = await query(
      `SELECT fr.*,
              p.payment_number, p.amount as payment_amount,
              s.full_name as student_name, s.student_id_code,
              c.name as company_name,
              u.first_name as approver_first_name, u.last_name as approver_last_name
       FROM fee_refunds fr
       JOIN fee_payments p ON p.id = fr.payment_id
       JOIN students s ON s.id = p.student_id
       JOIN companies c ON c.id = fr.company_id
       LEFT JOIN users u ON u.id = fr.approved_by
       WHERE fr.organization_id = $1
       ORDER BY fr.created_at DESC`,
      [auth.user.organization_id]
    );

    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'refunds.create' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { payment_id, amount, reason, refund_method = 'bank_transfer', reference_number } = body;

    const refundAmount = Number(amount);
    if (!payment_id || !refundAmount || refundAmount <= 0 || !reason) {
      return jsonError('Payment ID, refund amount, and reason are required', 400);
    }

    const created = await transaction(async ({ query: q }) => {
      // 1. Fetch original payment
      const pRes = await q(
        `SELECT p.*, sfa.id as account_id, sfa.total_paid, sfa.outstanding_balance
         FROM fee_payments p
         JOIN student_fee_accounts sfa ON sfa.id = p.student_fee_account_id
         WHERE p.id = $1 AND p.organization_id = $2`,
        [payment_id, auth.user.organization_id]
      );

      if (pRes.rows.length === 0) throw new Error('Original payment record not found');
      const pay = pRes.rows[0];

      if (refundAmount > Number(pay.amount)) {
        throw new Error(`Refund amount cannot exceed original payment of ₹${pay.amount}`);
      }

      const refundNumber = `REFUND-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const refRes = await q(
        `INSERT INTO fee_refunds (
          organization_id, company_id, payment_id, student_fee_account_id,
          refund_number, amount, refund_method, reference_number, reason, status, approved_by, processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'processed', $10, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          pay.organization_id,
          pay.company_id,
          pay.id,
          pay.account_id,
          refundNumber,
          refundAmount,
          refund_method,
          reference_number || 'REV-' + Math.floor(100000 + Math.random() * 900000),
          reason,
          auth.user.id,
        ]
      );

      // Re-adjust fee account ledger: total_paid decreases, balance increases
      const newPaid = Math.max(0, Number(pay.total_paid) - refundAmount);
      const newOutstanding = Number(pay.outstanding_balance) + refundAmount;

      await q(
        `UPDATE student_fee_accounts
         SET total_paid = $1,
             outstanding_balance = $2,
             status = 'partially_paid',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [newPaid, newOutstanding, pay.account_id]
      );

      return refRes.rows[0];
    });

    return jsonSuccess(created, 'Refund processed and ledger adjusted successfully!', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
