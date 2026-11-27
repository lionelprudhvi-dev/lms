import { query } from '@/lib/db';
import { getServerObservedIp } from '@/lib/geo-ip';
import { jsonSuccess, jsonError } from '@/lib/api-response';

export async function GET(request, { params }) {
  try {
    const { certNo } = params;

    const certRes = await query(
      `SELECT cert.id, cert.certificate_number, cert.student_name, cert.course_name,
              cert.issue_date, cert.completion_date, cert.status, cert.revoked_reason,
              cert.revoked_at, c.name as company_name, o.name as organization_name
       FROM certificates cert
       JOIN companies c ON c.id = cert.company_id
       JOIN organizations o ON o.id = cert.organization_id
       WHERE cert.certificate_number = $1`,
      [certNo.trim()]
    );

    const clientIp = getServerObservedIp(request);
    const userAgent = request.headers.get('user-agent') || 'Browser Client';

    if (certRes.rows.length === 0) {
      // Log invalid attempt
      await query(
        `INSERT INTO certificate_verification_logs (certificate_number, ip_address, user_agent, is_valid)
         VALUES ($1, $2, $3, false)`,
        [certNo, clientIp, userAgent]
      );
      return jsonError('Invalid Certificate: No credential found matching this verification ID.', 404);
    }

    const cert = certRes.rows[0];
    const isValid = cert.status === 'valid';

    // Log valid verification
    await query(
      `INSERT INTO certificate_verification_logs (certificate_id, certificate_number, ip_address, user_agent, is_valid)
       VALUES ($1, $2, $3, $4, $5)`,
      [cert.id, cert.certificate_number, clientIp, userAgent, isValid]
    );

    // Return public-safe data (NO private student address, phone, fee or sensitive data)
    return jsonSuccess({
      certificate_number: cert.certificate_number,
      student_name: cert.student_name,
      course_name: cert.course_name,
      company_name: cert.company_name,
      organization_name: cert.organization_name,
      issue_date: cert.issue_date,
      completion_date: cert.completion_date,
      status: cert.status,
      is_valid: isValid,
      revoked_reason: cert.status === 'revoked' ? cert.revoked_reason : null,
      revoked_at: cert.status === 'revoked' ? cert.revoked_at : null,
    });
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
