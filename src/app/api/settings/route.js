import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    let res = await query(
      `SELECT * FROM organization_settings WHERE organization_id = $1 LIMIT 1`,
      [auth.user.organization_id]
    );

    if (res.rows.length === 0) {
      // Initialize default settings if not yet existing
      const insertRes = await query(
        `INSERT INTO organization_settings (organization_id, currency, timezone, academic_year, attendance_geofence_default, ip_matching_scope, ip_matching_window_minutes, rules)
         VALUES ($1, 'INR', 'Asia/Kolkata', '2026-2027', 150, 'company', 60, '{"block_materials_on_unpaid": true, "block_exams_on_unpaid": true, "block_certificate_on_unpaid": true}'::jsonb)
         RETURNING *`,
        [auth.user.organization_id]
      );
      return jsonSuccess(insertRes.rows[0]);
    }

    return jsonSuccess(res.rows[0]);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function PUT(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'settings.update' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const {
      currency = 'INR',
      timezone = 'Asia/Kolkata',
      academic_year = '2026-2027',
      attendance_geofence_default = 150,
      ip_matching_scope = 'company',
      ip_matching_window_minutes = 60,
      rules = {},
    } = body;

    const res = await query(
      `INSERT INTO organization_settings (organization_id, currency, timezone, academic_year, attendance_geofence_default, ip_matching_scope, ip_matching_window_minutes, rules, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         currency = EXCLUDED.currency,
         timezone = EXCLUDED.timezone,
         academic_year = EXCLUDED.academic_year,
         attendance_geofence_default = EXCLUDED.attendance_geofence_default,
         ip_matching_scope = EXCLUDED.ip_matching_scope,
         ip_matching_window_minutes = EXCLUDED.ip_matching_window_minutes,
         rules = EXCLUDED.rules,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        auth.user.organization_id,
        currency,
        timezone,
        academic_year,
        attendance_geofence_default,
        ip_matching_scope,
        ip_matching_window_minutes,
        JSON.stringify(rules),
      ]
    );

    return jsonSuccess(res.rows[0], 'Settings updated successfully');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
