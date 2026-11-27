import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    const usersRes = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.user_type, u.is_active, u.created_at,
              COALESCE(
                json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name, 'code', r.code)) 
                FILTER (WHERE r.id IS NOT NULL), '[]'
              ) as roles,
              COALESCE(
                json_agg(DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'code', c.code))
                FILTER (WHERE c.id IS NOT NULL), '[]'
              ) as companies
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       LEFT JOIN user_company_access uca ON uca.user_id = u.id
       LEFT JOIN companies c ON c.id = uca.company_id
       WHERE u.organization_id = $1
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      [auth.user.organization_id]
    );

    return jsonSuccess(usersRes.rows);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await authorizeRequest(request, { allowedUserTypes: ['admin'] });
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { email, password, first_name, last_name, phone, user_type = 'student', role_ids = [], company_ids = [] } = body;

    if (!email || !password || !first_name || !last_name) {
      return jsonError('Email, password, first and last name are required', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insRes = await query(
      `INSERT INTO users (organization_id, email, password_hash, first_name, last_name, phone, user_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, phone, user_type, is_active, created_at`,
      [auth.user.organization_id, email.toLowerCase().trim(), passwordHash, first_name, last_name, phone, user_type]
    );

    const newUser = insRes.rows[0];

    // Assign roles
    if (role_ids.length > 0) {
      for (const rId of role_ids) {
        await query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [newUser.id, rId]);
      }
    }

    // Assign company access
    if (company_ids.length > 0) {
      for (const cId of company_ids) {
        await query(`INSERT INTO user_company_access (user_id, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [newUser.id, cId]);
      }
    }

    return jsonSuccess(newUser, 'User created successfully', 201);
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
