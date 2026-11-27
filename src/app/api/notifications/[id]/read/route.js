import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { id } = params;
    await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [id, auth.user.id]
    );

    return jsonSuccess(null, 'Notification marked as read');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
