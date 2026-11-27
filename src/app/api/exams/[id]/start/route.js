import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { id: examId } = params;

    if (auth.user.user_type !== 'student' || !auth.user.student) {
      return jsonError('Only enrolled students can initiate an exam attempt', 403);
    }

    const studentId = auth.user.student.id;

    // Check fee blockage rule
    const orgSettings = await query(
      `SELECT rules FROM organization_settings WHERE organization_id = $1`,
      [auth.user.organization_id]
    );
    const rules = orgSettings.rows[0]?.rules || {};
    if (rules.block_exams_on_unpaid) {
      const feeRes = await query(
        `SELECT outstanding_balance, status FROM student_fee_accounts WHERE student_id = $1`,
        [studentId]
      );
      if (feeRes.rows.length > 0 && Number(feeRes.rows[0].outstanding_balance) > 0 && feeRes.rows[0].status === 'overdue') {
        return jsonError('Access Restricted: Examination is locked due to overdue fee dues. Please contact accounts department.', 403);
      }
    }

    // Check existing attempt
    const existing = await query(
      `SELECT * FROM exam_attempts WHERE exam_id = $1 AND student_id = $2`,
      [examId, studentId]
    );

    if (existing.rows.length > 0) {
      const att = existing.rows[0];
      if (att.status === 'submitted' || att.status === 'evaluated') {
        return jsonError('You have already submitted this examination.', 400);
      }
      return jsonSuccess(att, 'Resuming active attempt');
    }

    // Create new attempt
    const newAttempt = await query(
      `INSERT INTO exam_attempts (exam_id, student_id, attempt_number, start_time, status)
       VALUES ($1, $2, 1, CURRENT_TIMESTAMP, 'in_progress')
       RETURNING *`,
      [examId, studentId]
    );

    return jsonSuccess(newAttempt.rows[0], 'Exam started successfully. Timer active.');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
