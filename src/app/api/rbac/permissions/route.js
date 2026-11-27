import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const permsRes = await query(
      `SELECT module, action, code, description
       FROM permissions
       ORDER BY module ASC, action ASC`
    );

    // Group by module for easy matrix rendering
    const modulesMap = {};
    for (const p of permsRes.rows) {
      if (!modulesMap[p.module]) {
        modulesMap[p.module] = [];
      }
      modulesMap[p.module].push(p);
    }

    return jsonSuccess({
      flat: permsRes.rows,
      grouped: modulesMap,
      actions: ['create', 'read', 'update', 'delete', 'approve', 'override', 'export', 'print']
    });
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
