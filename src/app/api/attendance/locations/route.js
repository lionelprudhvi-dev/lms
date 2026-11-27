import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    let sql = `
      SELECT cl.*, c.name as company_name, c.code as company_code
      FROM company_locations cl
      JOIN companies c ON c.id = cl.company_id
      WHERE cl.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (companyId) {
      params.push(companyId);
      sql += ` AND cl.company_id = $${params.length}`;
    }

    sql += ` ORDER BY cl.name ASC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'attendance.create' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { company_id, name, latitude, longitude, radius_meters = 150, is_active = true } = body;

    if (!company_id || !name || !latitude || !longitude) {
      return jsonError('Company, location name, latitude, and longitude are required', 400);
    }

    const res = await query(
      `INSERT INTO company_locations (organization_id, company_id, name, latitude, longitude, radius_meters, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [auth.user.organization_id, company_id, name, latitude, longitude, radius_meters, is_active]
    );

    return jsonSuccess(res.rows[0], 'Approved geofence location added successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
