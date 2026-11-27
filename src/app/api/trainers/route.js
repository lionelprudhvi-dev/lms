import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    let sql = `
      SELECT t.*, 
             c.name as company_name, c.code as company_code,
             COUNT(DISTINCT bt.batch_id) as batch_count
      FROM trainers t
      JOIN companies c ON c.id = t.company_id
      LEFT JOIN batch_trainers bt ON bt.trainer_id = t.id
      WHERE t.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (companyId) {
      params.push(companyId);
      sql += ` AND t.company_id = $${params.length}`;
    }

    sql += ` GROUP BY t.id, c.name, c.code ORDER BY t.created_at DESC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'trainers.create' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { full_name, email, phone, company_id, qualification, skills, experience_years = 3, status = 'active' } = body;

    if (!full_name || !email || !company_id) {
      return jsonError('Trainer name, email, and company assignment are required', 400);
    }

    const trainerIdCode = `TRN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const res = await query(
      `INSERT INTO trainers (organization_id, company_id, trainer_id_code, full_name, email, phone, qualification, skills, experience_years, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [auth.user.organization_id, company_id, trainerIdCode, full_name, email, phone, qualification, skills, experience_years, status]
    );

    return jsonSuccess(res.rows[0], 'Trainer created successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
