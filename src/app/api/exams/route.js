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
      SELECT e.*,
             c.name as company_name, c.code as company_code,
             cr.name as course_name, cr.code as course_code,
             b.name as batch_name,
             COUNT(DISTINCT q.id) as question_count,
             COUNT(DISTINCT ea.student_id) as assigned_students_count,
             COUNT(DISTINCT eat.id) as submitted_attempts_count
      FROM examinations e
      JOIN companies c ON c.id = e.company_id
      JOIN courses cr ON cr.id = e.course_id
      LEFT JOIN batches b ON b.id = e.batch_id
      LEFT JOIN questions q ON q.exam_id = e.id
      LEFT JOIN exam_assignments ea ON ea.exam_id = e.id
      LEFT JOIN exam_attempts eat ON eat.exam_id = e.id AND eat.status IN ('submitted', 'evaluated')
      WHERE e.organization_id = $1
    `;
    const params = [auth.user.organization_id];

    if (companyId) {
      params.push(companyId);
      sql += ` AND e.company_id = $${params.length}`;
    }

    if (courseId) {
      params.push(courseId);
      sql += ` AND e.course_id = $${params.length}`;
    }

    sql += ` GROUP BY e.id, c.name, c.code, cr.name, cr.code, b.name ORDER BY e.exam_date DESC, e.start_time DESC`;

    const res = await query(sql, params);
    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { permission: 'examinations.create' });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const {
      name,
      code,
      company_id,
      course_id,
      batch_id,
      exam_date,
      start_time,
      end_time,
      duration_minutes = 60,
      total_marks = 50,
      passing_marks = 20,
      negative_marking_per_question = 0,
      max_attempts = 1,
      instructions = 'Please complete all questions before timer expires.',
      status = 'scheduled',
    } = body;

    if (!name || !code || !company_id || !course_id || !exam_date) {
      return jsonError('Exam name, code, company, course, and exam date are required', 400);
    }

    const exam = await transaction(async ({ query: q }) => {
      const insRes = await q(
        `INSERT INTO examinations (
          organization_id, company_id, course_id, batch_id, name, code, exam_date, start_time, end_time,
          duration_minutes, total_marks, passing_marks, negative_marking_per_question, max_attempts, instructions, status, is_published
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true)
        RETURNING *`,
        [
          auth.user.organization_id,
          company_id,
          course_id,
          batch_id || null,
          name,
          code.toUpperCase(),
          exam_date,
          start_time || new Date().toISOString(),
          end_time || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          duration_minutes,
          total_marks,
          passing_marks,
          negative_marking_per_question,
          max_attempts,
          instructions,
          status,
        ]
      );
      const ex = insRes.rows[0];

      // Auto-assign students enrolled in batch or course
      if (batch_id) {
        await q(
          `INSERT INTO exam_assignments (exam_id, student_id)
           SELECT $1, student_id FROM batch_students WHERE batch_id = $2
           ON CONFLICT DO NOTHING`,
          [ex.id, batch_id]
        );
      } else {
        await q(
          `INSERT INTO exam_assignments (exam_id, student_id)
           SELECT $1, student_id FROM course_enrollments WHERE course_id = $2
           ON CONFLICT DO NOTHING`,
          [ex.id, course_id]
        );
      }

      return ex;
    });

    return jsonSuccess(exam, 'Examination created and scheduled successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
