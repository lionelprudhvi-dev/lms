import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const auth = await authorizeRequest(request, { permission: 'certificates.delete' });
    if (!auth.authorized) return auth.response;

    const { id } = params;
    const body = await request.json();
    const { reason = 'Revoked by administration' } = body;

    await query(
      `UPDATE certificates
       SET status = 'revoked',
           revoked_reason = $1,
           revoked_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE (id = $2 OR certificate_number = $2) AND organization_id = $3`,
      [reason, id, auth.user.organization_id]
    );

    return jsonSuccess(null, 'Certificate successfully revoked');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
