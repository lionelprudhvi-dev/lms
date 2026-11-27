import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { id } = params;
    const roleRes = await query(`SELECT * FROM roles WHERE id = $1 AND organization_id = $2`, [id, auth.user.organization_id]);
    if (roleRes.rows.length === 0) return jsonError('Role not found', 404);

    const permsRes = await query(
      `SELECT p.code FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = $1`,
      [id]
    );

    const role = roleRes.rows[0];
    role.permissions = permsRes.rows.map((p) => p.code);

    return jsonSuccess(role);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await authorizeRequest(request, { allowedUserTypes: ['admin'] });
    if (!auth.authorized) return auth.response;

    const { id } = params;
    const body = await request.json();
    const { name, description, permissions } = body;

    const roleRes = await query(`SELECT * FROM roles WHERE id = $1 AND organization_id = $2`, [id, auth.user.organization_id]);
    if (roleRes.rows.length === 0) return jsonError('Role not found', 404);

    if (name) {
      await query(`UPDATE roles SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`, [name, description, id]);
    }

    if (Array.isArray(permissions)) {
      // Clear old permissions and reassign
      await query(`DELETE FROM role_permissions WHERE role_id = $1`, [id]);
      for (const pCode of permissions) {
        await query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT $1, id FROM permissions WHERE code = $2`,
          [id, pCode]
        );
      }
    }

    return jsonSuccess(null, 'Role permissions updated successfully');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await authorizeRequest(request, { allowedUserTypes: ['admin'] });
    if (!auth.authorized) return auth.response;

    const { id } = params;
    const roleRes = await query(`SELECT * FROM roles WHERE id = $1 AND organization_id = $2`, [id, auth.user.organization_id]);
    if (roleRes.rows.length === 0) return jsonError('Role not found', 404);

    if (roleRes.rows[0].is_system) {
      return jsonError('Cannot delete a system role', 400);
    }

    await query(`DELETE FROM roles WHERE id = $1`, [id]);
    return jsonSuccess(null, 'Role deleted successfully');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
