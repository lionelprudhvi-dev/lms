import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query, transaction } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const { id: examId } = params;
    const body = await request.json();
    const { answers = {}, time_spent_seconds = 0, tab_switches = 0 } = body;

    if (auth.user.user_type !== 'student' || !auth.user.student) {
      return jsonError('Only registered students can submit exam answers', 403);
    }

    const studentId = auth.user.student.id;

    // Fetch active attempt
    const attemptRes = await query(
      `SELECT * FROM exam_attempts WHERE exam_id = $1 AND student_id = $2 AND status = 'in_progress'`,
      [examId, studentId]
    );

    if (attemptRes.rows.length === 0) {
      return jsonError('No active in-progress attempt found to submit.', 400);
    }

    const attempt = attemptRes.rows[0];

    // Fetch exam details
    const examRes = await query(`SELECT * FROM examinations WHERE id = $1`, [examId]);
    const exam = examRes.rows[0];

    // Fetch all questions and correct options for objective evaluation
    const questionsRes = await query(
      `SELECT q.id, q.question_type, q.marks, q.negative_marks,
              COALESCE(
                json_agg(
                  jsonb_build_object('id', qo.id, 'text', qo.option_text, 'is_correct', qo.is_correct)
                ) FILTER (WHERE qo.id IS NOT NULL), '[]'
              ) as options
       FROM questions q
       LEFT JOIN question_options qo ON qo.question_id = q.id
       WHERE q.exam_id = $1
       GROUP BY q.id`,
      [examId]
    );

    let totalScore = 0;
    let totalPossibleMarks = 0;

    const submissionResult = await transaction(async ({ query: q }) => {
      for (const question of questionsRes.rows) {
        const studentAns = answers[question.id] || '';
        totalPossibleMarks += Number(question.marks || 1);

        let isCorrect = false;
        let awardedMarks = 0;

        if (question.question_type === 'mcq' || question.question_type === 'true_false') {
          const correctOption = question.options.find((o) => o.is_correct);
          if (correctOption && (studentAns === correctOption.id || studentAns.toLowerCase() === correctOption.text.toLowerCase())) {
            isCorrect = true;
            awardedMarks = Number(question.marks || 1);
          } else if (studentAns) {
            awardedMarks = -Number(question.negative_marks || 0);
          }
        } else if (question.question_type === 'multi_select') {
          // Compare arrays
          const correctIds = question.options.filter((o) => o.is_correct).map((o) => o.id).sort();
          const selectedIds = Array.isArray(studentAns) ? studentAns.sort() : [];
          if (JSON.stringify(correctIds) === JSON.stringify(selectedIds)) {
            isCorrect = true;
            awardedMarks = Number(question.marks || 1);
          }
        } else {
          // Descriptive / short text
          if (studentAns && studentAns.trim().length > 0) {
            isCorrect = true;
            awardedMarks = Number(question.marks || 1);
          }
        }

        totalScore += awardedMarks;

        // Save answer record
        await q(
          `INSERT INTO exam_answers (attempt_id, question_id, student_answer, is_correct, marks_awarded)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (attempt_id, question_id) DO UPDATE SET 
             student_answer = EXCLUDED.student_answer,
             is_correct = EXCLUDED.is_correct,
             marks_awarded = EXCLUDED.marks_awarded`,
          [attempt.id, question.id, typeof studentAns === 'object' ? JSON.stringify(studentAns) : String(studentAns), isCorrect, awardedMarks]
        );
      }

      totalScore = Math.max(0, totalScore);
      const percentage = totalPossibleMarks > 0 ? Math.round((totalScore / totalPossibleMarks) * 100) : 0;
      const isPassed = totalScore >= Number(exam.passing_marks);

      // Determine Grade
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C';
      else if (isPassed) grade = 'Pass';

      // Update attempt
      await q(
        `UPDATE exam_attempts
         SET submitted_at = CURRENT_TIMESTAMP,
             time_spent_seconds = $1,
             tab_switches_count = $2,
             status = 'evaluated',
             total_score = $3,
             percentage = $4,
             is_passed = $5
         WHERE id = $6`,
        [time_spent_seconds, tab_switches, totalScore, percentage, isPassed, attempt.id]
      );

      // Upsert Exam Result
      await q(
        `INSERT INTO exam_results (exam_id, student_id, attempt_id, total_marks, marks_obtained, percentage, grade, status, is_published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (exam_id, student_id) DO UPDATE SET
           attempt_id = EXCLUDED.attempt_id,
           total_marks = EXCLUDED.total_marks,
           marks_obtained = EXCLUDED.marks_obtained,
           percentage = EXCLUDED.percentage,
           grade = EXCLUDED.grade,
           status = EXCLUDED.status,
           published_at = CURRENT_TIMESTAMP`,
        [examId, studentId, attempt.id, totalPossibleMarks, totalScore, percentage, grade, isPassed ? 'passed' : 'failed']
      );

      return {
        totalScore,
        totalPossibleMarks,
        percentage,
        grade,
        isPassed,
      };
    });

    return jsonSuccess(submissionResult, 'Examination submitted and auto-evaluated successfully!');
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
