import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { id } = params;

    const examRes = await query(
      `SELECT e.*, c.name as company_name, cr.name as course_name, b.name as batch_name
       FROM examinations e
       JOIN companies c ON c.id = e.company_id
       JOIN courses cr ON cr.id = e.course_id
       LEFT JOIN batches b ON b.id = e.batch_id
       WHERE e.id = $1 AND e.organization_id = $2`,
      [id, auth.user.organization_id]
    );

    if (examRes.rows.length === 0) return jsonError('Exam not found', 404);
    const exam = examRes.rows[0];

    const isStudent = auth.user.user_type === 'student';

    // Fetch questions and options
    const qRes = await query(
      `SELECT q.*,
              COALESCE(
                json_agg(
                  jsonb_build_object(
                    'id', qo.id,
                    'option_text', qo.option_text,
                    'order_index', qo.order_index
                    ${isStudent ? '' : ", 'is_correct', qo.is_correct"}
                  ) ORDER BY qo.order_index ASC
                ) FILTER (WHERE qo.id IS NOT NULL), '[]'
              ) as options
       FROM questions q
       LEFT JOIN question_options qo ON qo.question_id = q.id
       WHERE q.exam_id = $1
       GROUP BY q.id
       ORDER BY q.order_index ASC`,
      [id]
    );
    exam.questions = qRes.rows;

    // If student, check existing attempt
    if (isStudent && auth.user.student) {
      const attemptRes = await query(
        `SELECT * FROM exam_attempts WHERE exam_id = $1 AND student_id = $2 ORDER BY attempt_number DESC LIMIT 1`,
        [id, auth.user.student.id]
      );
      exam.myAttempt = attemptRes.rows[0] || null;

      // Fee check rule: if rules specify block exams on unpaid fees, check fee account!
      const feeRes = await query(
        `SELECT status, outstanding_balance FROM student_fee_accounts WHERE student_id = $1`,
        [auth.user.student.id]
      );
      if (feeRes.rows.length > 0) {
        exam.feeAccount = feeRes.rows[0];
      }
    }

    return jsonSuccess(exam);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
