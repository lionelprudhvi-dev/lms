import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query, transaction } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const courseId = searchParams.get('courseId');

    let sql = `
      SELECT b.*,
             c.name as company_name, c.code as company_code,
             cr.name as course_name, cr.code as course_code,
             COUNT(DISTINCT bs.student_id) as enrolled_count,
             COALESCE(
               json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.full_name, 'is_primary', bt.is_primary))
               FILTER (WHERE t.id IS NOT NULL), '[]'
             ) as trainers
      FROM batches b
      JOIN companies c ON c.id = b.company_id
      JOIN courses cr ON cr.id = b.course_id
      LEFT JOIN batch_students bs ON bs.batch_id = b.id
      LEFT JOIN batch_trainers bt ON bt.batch_id = b.id
      LEFT JOIN trainers t ON t.id = bt.trainer_id
      WHERE b.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (companyId) {
      params.push(companyId);
      sql += ` AND b.company_id = $${params.length}`;
    }

    if (courseId) {
      params.push(courseId);
      sql += ` AND b.course_id = $${params.length}`;
    }

    sql += ` GROUP BY b.id, c.name, c.code, cr.name, cr.code ORDER BY b.start_date DESC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'batches.create' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { name, code, company_id, course_id, start_date, end_date, schedule_time = '09:30 AM - 01:30 PM', days_of_week = 'Mon,Tue,Wed,Thu,Fri', capacity = 30, trainer_ids = [] } = body;

    if (!name || !code || !company_id || !course_id || !start_date) {
      return jsonError('Batch name, code, company, course, and start date are required', 400);
    }

    const batch = await transaction(async ({ query: q }) => {
      const insRes = await q(
        `INSERT INTO batches (organization_id, company_id, course_id, name, code, start_date, end_date, schedule_time, days_of_week, capacity, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
         RETURNING *`,
        [auth.user.organization_id, company_id, course_id, name, code.toUpperCase(), start_date, end_date || null, schedule_time, days_of_week, capacity]
      );
      const b = insRes.rows[0];

      if (trainer_ids && trainer_ids.length > 0) {
        for (let i = 0; i < trainer_ids.length; i++) {
          await q(
            `INSERT INTO batch_trainers (batch_id, trainer_id, is_primary) VALUES ($1, $2, $3)`,
            [b.id, trainer_ids[i], i === 0]
          );
        }
      }

      return b;
    });

    return jsonSuccess(batch, 'Batch created successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
