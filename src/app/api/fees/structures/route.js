import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query, transaction } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    let sql = `
      SELECT fs.*,
             c.name as company_name, c.code as company_code,
             cr.name as course_name, cr.code as course_code,
             COALESCE(
               json_agg(
                 jsonb_build_object('id', fc.id, 'name', fc.name, 'amount', fc.amount)
               ) FILTER (WHERE fc.id IS NOT NULL), '[]'
             ) as components
      FROM fee_structures fs
      JOIN companies c ON c.id = fs.company_id
      JOIN courses cr ON cr.id = fs.course_id
      LEFT JOIN fee_components fc ON fc.fee_structure_id = fs.id
      WHERE fs.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (companyId) {
      params.push(companyId);
      sql += ` AND fs.company_id = $${params.length}`;
    }

    sql += ` GROUP BY fs.id, c.name, c.code, cr.name, cr.code ORDER BY fs.created_at DESC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'fee_structures.create' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const {
      name,
      company_id,
      course_id,
      batch_id,
      academic_year = '2026-2027',
      total_fee,
      registration_fee = 0,
      tuition_fee = 0,
      exam_fee = 0,
      material_fee = 0,
      certification_fee = 0,
      components = [],
    } = body;

    if (!name || !company_id || !course_id || !total_fee) {
      return jsonError('Structure name, company, course, and total fee are required', 400);
    }

    const created = await transaction(async ({ query: q }) => {
      const fsRes = await q(
        `INSERT INTO fee_structures (
          organization_id, company_id, course_id, batch_id, academic_year, name, total_fee,
          registration_fee, tuition_fee, exam_fee, material_fee, certification_fee, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
        RETURNING *`,
        [
          auth.user.organization_id,
          company_id,
          course_id,
          batch_id || null,
          academic_year,
          name,
          total_fee,
          registration_fee,
          tuition_fee,
          exam_fee,
          material_fee,
          certification_fee,
        ]
      );
      const fs = fsRes.rows[0];

      if (components && components.length > 0) {
        for (const comp of components) {
          if (comp.name && comp.amount) {
            await q(
              `INSERT INTO fee_components (fee_structure_id, name, amount) VALUES ($1, $2, $3)`,
              [fs.id, comp.name, comp.amount]
            );
          }
        }
      }

      return fs;
    });

    return jsonSuccess(created, 'Fee structure created successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
