import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const stuRes = await query(`SELECT id FROM students WHERE user_id = $1`, [auth.user.id]);
    if (stuRes.rows.length === 0) return jsonError('Student record not found', 404);

    const studentId = stuRes.rows[0].id;
    const today = new Date().toISOString().split('T')[0];

    const attRes = await query(
      `SELECT id, check_in_time, check_out_time FROM attendance WHERE student_id = $1 AND date = $2`,
      [studentId, today]
    );

    if (attRes.rows.length === 0) {
      return jsonError('No check-in record found for today. Please check in first.', 400);
    }

    if (attRes.rows[0].check_out_time) {
      return jsonError('You have already checked out for today.', 400);
    }

    await query(
      `UPDATE attendance SET check_out_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [attRes.rows[0].id]
    );

    return jsonSuccess(null, 'Check-out completed successfully');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
