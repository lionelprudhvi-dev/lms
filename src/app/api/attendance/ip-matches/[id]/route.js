import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const auth = await authorizeRequest(request, { permission: 'attendance.update' });
    if (!auth.authorized) return auth.response;

    const { id } = params;
    const body = await request.json();
    const { status, admin_notes } = body; // 'reviewed', 'dismissed', 'confirmed'

    if (!status) return jsonError('Review status is required', 400);

    await query(
      `UPDATE attendance_ip_matches
       SET status = $1,
           admin_notes = COALESCE($2, admin_notes),
           reviewed_by = $3,
           reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND organization_id = $5`,
      [status, admin_notes, auth.user.id, id, auth.user.organization_id]
    );

    return jsonSuccess(null, `IP match record marked as ${status}`);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
