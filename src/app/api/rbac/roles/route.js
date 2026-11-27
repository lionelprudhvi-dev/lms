import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const rolesRes = await query(
      `SELECT r.*,
              COUNT(ur.user_id) as user_count,
              COALESCE(
                json_agg(p.code) FILTER (WHERE p.code IS NOT NULL), '[]'
              ) as permissions
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       WHERE r.organization_id = $1
       GROUP BY r.id
       ORDER BY r.is_system DESC, r.name ASC`,
      [auth.user.organization_id]
    );

    return jsonSuccess(rolesRes.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { allowedUserTypes: ['admin'] });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { name, code, description, permissions = [] } = body;

    if (!name || !code) {
      return jsonError('Role name and code are required', 400);
    }

    const insRes = await query(
      `INSERT INTO roles (organization_id, name, code, description, is_system)
       VALUES ($1, $2, $3, $4, false)
       RETURNING *`,
      [auth.user.organization_id, name, code.toUpperCase(), description]
    );
    const newRole = insRes.rows[0];

    // Assign permissions
    if (permissions.length > 0) {
      for (const pCode of permissions) {
        await query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT $1, id FROM permissions WHERE code = $2`,
          [newRole.id, pCode]
        );
      }
    }

    return jsonSuccess(newRole, 'Role created successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
