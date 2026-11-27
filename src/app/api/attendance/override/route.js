import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query, transaction } from '@/lib/db';

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'attendance_override.override' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { attendance_id, new_status, reason, remarks } = body;

    if (!attendance_id || !new_status || !reason) {
      return jsonError('Attendance record ID, new status, and mandatory audit reason are required', 400);
    }

    const result = await transaction(async ({ query: q }) => {
      // 1. Get original record
      const origRes = await q(
        `SELECT id, status, check_in_time FROM attendance WHERE id = $1 AND organization_id = $2`,
        [attendance_id, auth.user.organization_id]
      );

      if (origRes.rows.length === 0) {
        throw new Error('Attendance record not found');
      }

      const original = origRes.rows[0];

      // 2. Insert into immutable audit log
      await q(
        `INSERT INTO attendance_override_logs (
          attendance_id, previous_status, new_status, reason, remarks, modified_by
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [attendance_id, original.status, new_status, reason, remarks || null, auth.user.id]
      );

      // 3. Update attendance record
      await q(
        `UPDATE attendance
         SET status = $1,
             is_flagged = false,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [new_status, attendance_id]
      );

      return { attendance_id, previous_status: original.status, new_status };
    });

    return jsonSuccess(result, 'Attendance status overridden and recorded in audit log');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const res = await query(
      `SELECT aol.*,
              s.full_name as student_name, s.student_id_code,
              u.first_name as modifier_first_name, u.last_name as modifier_last_name,
              a.date
       FROM attendance_override_logs aol
       JOIN attendance a ON a.id = aol.attendance_id
       JOIN students s ON s.id = a.student_id
       LEFT JOIN users u ON u.id = aol.modified_by
       WHERE a.organization_id = $1
       ORDER BY aol.created_at DESC`,
      [auth.user.organization_id]
    );

    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
