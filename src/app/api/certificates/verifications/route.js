import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const res = await query(
      `SELECT cvl.*, cert.student_name, cert.course_name
       FROM certificate_verification_logs cvl
       LEFT JOIN certificates cert ON cert.id = cvl.certificate_id
       ORDER BY cvl.verified_at DESC
       LIMIT 100`
    );

    return jsonSuccess(res.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
