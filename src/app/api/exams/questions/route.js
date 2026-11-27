import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query, transaction } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    let sql = `
      SELECT q.*,
             e.name as exam_name,
             COALESCE(
               json_agg(
                 jsonb_build_object('id', qo.id, 'text', qo.option_text, 'is_correct', qo.is_correct)
               ) FILTER (WHERE qo.id IS NOT NULL), '[]'
             ) as options
      FROM questions q
      LEFT JOIN examinations e ON e.id = q.exam_id
      LEFT JOIN question_options qo ON qo.question_id = q.id
      WHERE (e.organization_id = $1 OR q.exam_id IS NULL)
    `;
    const params = [auth.user.organization_id];

    if (examId) {
      params.push(examId);
      sql += ` AND q.exam_id = $${params.length}`;
    }

    sql += ` GROUP BY q.id, e.name ORDER BY q.created_at DESC`;

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
    const { exam_id, question_text, question_type = 'mcq', difficulty = 'medium', marks = 5, negative_marks = 0, options = [], explanation } = body;

    if (!exam_id || !question_text) {
      return jsonError('Exam assignment and question text are required', 400);
    }

    const created = await transaction(async ({ query: q }) => {
      const qRes = await q(
        `INSERT INTO questions (exam_id, question_text, question_type, difficulty, marks, negative_marks, explanation)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [exam_id, question_text, question_type, difficulty, marks, negative_marks, explanation || null]
      );
      const question = qRes.rows[0];

      if (options && options.length > 0) {
        for (let i = 0; i < options.length; i++) {
          await q(
            `INSERT INTO question_options (question_id, option_text, is_correct, order_index)
             VALUES ($1, $2, $3, $4)`,
            [question.id, options[i].text, Boolean(options[i].is_correct), i + 1]
          );
        }
      }

      return question;
    });

    return jsonSuccess(created, 'Question added successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
