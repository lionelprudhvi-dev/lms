import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    let companies = [];
    if (auth.user.isOrgAdmin) {
      const res = await query(
        `SELECT c.*, 
                (SELECT COUNT(*) FROM students s WHERE s.company_id = c.id) as student_count,
                (SELECT COUNT(*) FROM courses cr WHERE cr.company_id = c.id) as course_count,
                (SELECT COUNT(*) FROM batches b WHERE b.company_id = c.id) as batch_count
         FROM companies c
         WHERE c.organization_id = $1
         ORDER BY c.name`,
        [auth.user.organization_id]
      );
      companies = res.rows;
    } else {
      const res = await query(
        `SELECT c.*,
                (SELECT COUNT(*) FROM students s WHERE s.company_id = c.id) as student_count,
                (SELECT COUNT(*) FROM courses cr WHERE cr.company_id = c.id) as course_count,
                (SELECT COUNT(*) FROM batches b WHERE b.company_id = c.id) as batch_count
         FROM user_company_access uca
         JOIN companies c ON c.id = uca.company_id
         WHERE uca.user_id = $1
         ORDER BY c.name`,
        [auth.user.id]
      );
      companies = res.rows;
    }

    return jsonSuccess(companies);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { allowedUserTypes: ['admin'] });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { name, code, contact_email, contact_phone, gstin, address, status = 'active' } = body;

    if (!name || !code) {
      return jsonError('Company name and unique code are required', 400);
    }

    const insRes = await query(
      `INSERT INTO companies (organization_id, name, code, contact_email, contact_phone, gstin, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [auth.user.organization_id, name, code.toUpperCase(), contact_email, contact_phone, gstin, address, status]
    );

    const newCompany = insRes.rows[0];

    // Grant org admin access
    await query(
      `INSERT INTO user_company_access (user_id, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [auth.user.id, newCompany.id]
    );

    return jsonSuccess(newCompany, 'Company created successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
