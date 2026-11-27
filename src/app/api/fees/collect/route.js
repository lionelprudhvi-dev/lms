import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query, transaction } from '@/lib/db';

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'fee_collection.create' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const {
      student_id,
      amount,
      payment_method = 'upi',
      reference_number,
      remarks,
      installment_id,
    } = body;

    const payAmount = Number(amount);
    if (!student_id || !payAmount || payAmount <= 0) {
      return jsonError('Student and valid positive payment amount are required', 400);
    }

    const result = await transaction(async ({ query: q }) => {
      // 1. Get student fee account
      const accRes = await q(
        `SELECT sfa.*, s.full_name as student_name, s.student_id_code,
                c.name as company_name, cr.name as course_name, b.name as batch_name
         FROM student_fee_accounts sfa
         JOIN students s ON s.id = sfa.student_id
         JOIN companies c ON c.id = sfa.company_id
         LEFT JOIN courses cr ON cr.id = sfa.course_id
         LEFT JOIN batches b ON b.id = sfa.batch_id
         WHERE sfa.student_id = $1 AND sfa.organization_id = $2`,
        [student_id, auth.user.organization_id]
      );

      if (accRes.rows.length === 0) {
        throw new Error('Student fee account not found');
      }

      const account = accRes.rows[0];
      const prevOutstanding = Number(account.outstanding_balance);
      const newTotalPaid = Number(account.total_paid) + payAmount;
      const newOutstanding = Math.max(0, prevOutstanding - payAmount);

      // Determine new status
      let newStatus = 'partially_paid';
      if (newOutstanding === 0) newStatus = 'paid';
      else if (newTotalPaid === 0) newStatus = 'pending';

      // 2. Insert Fee Payment
      const paymentNumber = `PAY-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const payRes = await q(
        `INSERT INTO fee_payments (
          organization_id, company_id, student_fee_account_id, student_id, payment_number,
          amount, payment_method, reference_number, remarks, collected_by, is_confirmed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
        RETURNING *`,
        [
          account.organization_id,
          account.company_id,
          account.id,
          student_id,
          paymentNumber,
          payAmount,
          payment_method,
          referenceNumber || 'REF-' + Math.floor(100000 + Math.random() * 900000),
          remarks || 'Fee Collection Desk',
          auth.user.id,
        ]
      );
      const payment = payRes.rows[0];

      // 3. Allocate to installments
      if (installment_id) {
        await q(
          `INSERT INTO payment_allocations (payment_id, installment_id, allocated_amount) VALUES ($1, $2, $3)`,
          [payment.id, installment_id, payAmount]
        );

        await q(
          `UPDATE fee_installments
           SET paid_amount = paid_amount + $1,
               status = CASE WHEN paid_amount + $1 >= due_amount THEN 'paid' ELSE 'partially_paid' END,
               paid_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [payAmount, installment_id]
        );
      } else {
        // Auto-allocate across pending installments sequentially
        const instRes = await q(
          `SELECT id, due_amount, paid_amount FROM fee_installments
           WHERE student_fee_account_id = $1 AND status != 'paid'
           ORDER BY installment_number ASC`,
          [account.id]
        );

        let remainingToAllocate = payAmount;
        for (const inst of instRes.rows) {
          if (remainingToAllocate <= 0) break;
          const dueLeft = Number(inst.due_amount) - Number(inst.paid_amount);
          const alloc = Math.min(remainingToAllocate, dueLeft);

          await q(
            `INSERT INTO payment_allocations (payment_id, installment_id, allocated_amount) VALUES ($1, $2, $3)`,
            [payment.id, inst.id, alloc]
          );

          await q(
            `UPDATE fee_installments
             SET paid_amount = paid_amount + $1,
                 status = CASE WHEN paid_amount + $1 >= due_amount THEN 'paid' ELSE 'partially_paid' END,
                 paid_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [alloc, inst.id]
          );

          remainingToAllocate -= alloc;
        }
      }

      // 4. Update student fee account balance and status
      await q(
        `UPDATE student_fee_accounts
         SET total_paid = $1,
             outstanding_balance = $2,
             status = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [newTotalPaid, newOutstanding, newStatus, account.id]
      );

      // 5. Generate Official Payment Receipt Record
      const receiptNumber = `RCPT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const rcptRes = await q(
        `INSERT INTO payment_receipts (
          organization_id, company_id, payment_id, receipt_number, student_id,
          student_name, course_name, batch_name, amount, payment_method,
          previous_outstanding, current_outstanding, collector_name, remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          account.organization_id,
          account.company_id,
          payment.id,
          receiptNumber,
          student_id,
          account.student_name,
          account.course_name,
          account.batch_name,
          payAmount,
          payment_method,
          prevOutstanding,
          newOutstanding,
          `${auth.user.first_name} ${auth.user.last_name}`,
          remarks || 'Fee Collection Desk Payment',
        ]
      );
      const receipt = rcptRes.rows[0];

      await q(`UPDATE fee_payments SET receipt_id = $1 WHERE id = $2`, [receipt.id, payment.id]);

      // 6. Notify student
      const userRes = await q(`SELECT user_id FROM students WHERE id = $1`, [student_id]);
      if (userRes.rows[0]?.user_id) {
        await q(
          `INSERT INTO notifications (user_id, title, message, type, link_url)
           VALUES ($1, 'Fee Payment Acknowledged', $2, 'success', '/student/fees')`,
          [
            userRes.rows[0].user_id,
            `Your payment of ₹${payAmount.toLocaleString()} has been recorded under Receipt ${receiptNumber}. Outstanding balance: ₹${newOutstanding.toLocaleString()}.`,
          ]
        );
      }

      return { payment, receipt, newOutstanding };
    });

    return jsonSuccess(result, 'Fee payment processed and official receipt issued successfully!', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
