import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const orgRes = await query(
      `SELECT o.*, os.currency, os.timezone, os.academic_year, os.attendance_geofence_default, os.ip_matching_scope, os.ip_matching_window_minutes, os.rules
       FROM organizations o
       LEFT JOIN organization_settings os ON os.organization_id = o.id
       WHERE o.id = $1`,
      [auth.user.organization_id]
    );

    return jsonSuccess(orgRes.rows[0] || null);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function PUT(request) {
  try {
    const auth = await authorizeRequest(request, { allowedUserTypes: ['admin'] });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { name, website, email, phone, address, currency, timezone, academic_year, attendance_geofence_default, ip_matching_scope, ip_matching_window_minutes, rules } = body;

    await query(
      `UPDATE organizations
       SET name = COALESCE($1, name),
           website = COALESCE($2, website),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [name, website, email, phone, address, auth.user.organization_id]
    );

    if (currency || timezone || academic_year || attendance_geofence_default || ip_matching_scope || rules) {
      await query(
        `UPDATE organization_settings
         SET currency = COALESCE($1, currency),
             timezone = COALESCE($2, timezone),
             academic_year = COALESCE($3, academic_year),
             attendance_geofence_default = COALESCE($4, attendance_geofence_default),
             ip_matching_scope = COALESCE($5, ip_matching_scope),
             ip_matching_window_minutes = COALESCE($6, ip_matching_window_minutes),
             rules = COALESCE($7, rules),
             updated_at = CURRENT_TIMESTAMP
         WHERE organization_id = $8`,
        [currency, timezone, academic_year, attendance_geofence_default, ip_matching_scope, ip_matching_window_minutes, rules ? JSON.stringify(rules) : null, auth.user.organization_id]
      );
    }

    return jsonSuccess(null, 'Organization settings updated successfully');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
