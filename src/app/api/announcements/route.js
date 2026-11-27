import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const res = await query(
      `SELECT a.*, c.name as company_name, u.first_name, u.last_name
       FROM announcements a
       LEFT JOIN companies c ON c.id = a.company_id
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.organization_id = $1
       ORDER BY a.published_at DESC`,
      [auth.user.organization_id]
    );

    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'announcements.create' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { title, content, company_id, target_role = 'all', priority = 'medium' } = body;

    if (!title || !content) {
      return jsonError('Title and content are required', 400);
    }

    const res = await query(
      `INSERT INTO announcements (organization_id, company_id, title, content, target_role, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [auth.user.organization_id, company_id || null, title, content, target_role, priority, auth.user.id]
    );

    return jsonSuccess(res.rows[0], 'Announcement broadcast successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function DELETE(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return jsonError('Announcement ID required', 400);

    await query(`DELETE FROM announcements WHERE id = $1 AND organization_id = $2`, [id, auth.user.organization_id]);
    return jsonSuccess(null, 'Announcement deleted successfully');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
