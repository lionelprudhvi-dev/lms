import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');

    // Return assignments from exam_assignments and course lessons
    let sql = `
      SELECT ea.id, ea.exam_id, ea.batch_id, ea.start_window, ea.end_window,
             e.title as exam_title, e.total_marks, e.duration_minutes,
             b.name as batch_name, c.name as course_name
      FROM exam_assignments ea
      JOIN examinations e ON e.id = ea.exam_id
      JOIN batches b ON b.id = ea.batch_id
      JOIN courses c ON c.id = b.course_id
      WHERE e.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (batchId) {
      params.push(batchId);
      sql += ` AND ea.batch_id = $${params.length}`;
    }

    sql += ` ORDER BY ea.start_window DESC`;

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
    const { exam_id, batch_id, start_window, end_window } = body;

    if (!exam_id || !batch_id || !start_window || !end_window) {
      return jsonError('Exam, batch, and time window are required', 400);
    }

    const res = await query(
      `INSERT INTO exam_assignments (exam_id, batch_id, start_window, end_window)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [exam_id, batch_id, start_window, end_window]
    );

    return jsonSuccess(res.rows[0], 'Assignment scheduled successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
