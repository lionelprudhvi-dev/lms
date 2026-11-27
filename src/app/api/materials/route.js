import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');
    const batchId = searchParams.get('batch_id');

    let sql = `
      SELECT m.*, c.name as course_name, b.name as batch_name, u.first_name, u.last_name
      FROM learning_materials m
      LEFT JOIN courses c ON c.id = m.course_id
      LEFT JOIN batches b ON b.id = m.batch_id
      LEFT JOIN users u ON u.id = m.uploaded_by
      WHERE m.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (courseId) {
      params.push(courseId);
      sql += ` AND m.course_id = $${params.length}`;
    }
    if (batchId) {
      params.push(batchId);
      sql += ` AND m.batch_id = $${params.length}`;
    }

    sql += ` ORDER BY m.created_at DESC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { title, course_id, batch_id, file_url, file_type = 'pdf', file_size = 0, company_id } = body;

    if (!title || !course_id) {
      return jsonError('Title and Course are required', 400);
    }

    // Determine company_id from course if not provided
    let compId = company_id;
    if (!compId) {
      const cRes = await query(`SELECT company_id FROM courses WHERE id = $1`, [course_id]);
      if (cRes.rows.length > 0) compId = cRes.rows[0].company_id;
      else compId = auth.user.company_access?.[0]?.company_id;
    }

    const res = await query(
      `INSERT INTO learning_materials (organization_id, company_id, course_id, batch_id, title, file_url, file_type, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [auth.user.organization_id, compId, course_id, batch_id || null, title, file_url || '#', file_type, file_size, auth.user.id]
    );

    return jsonSuccess(res.rows[0], 'Material uploaded successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
