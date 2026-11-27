import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';
import { jsonSuccess, jsonError } from '@/lib/api-response';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonError('Email and password are required', 400);
    }

    const userRes = await query(
      `SELECT u.id, u.organization_id, u.email, u.password_hash, u.first_name, u.last_name, u.phone, u.avatar_url, u.user_type, u.is_active,
              o.name as organization_name, o.code as organization_code
       FROM users u
       JOIN organizations o ON o.id = u.organization_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email.trim()]
    );

    if (userRes.rows.length === 0) {
      return jsonError('Invalid email or password', 401);
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      return jsonError('Your account has been deactivated. Please contact administrator.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return jsonError('Invalid email or password', 401);
    }

    // Fetch roles
    const rolesRes = await query(
      `SELECT r.id, r.name, r.code, r.is_system
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [user.id]
    );
    user.roles = rolesRes.rows;
    user.isOrgAdmin = user.roles.some((r) => r.code === 'ORG_ADMIN');

    // Fetch permissions
    const permsRes = await query(
      `SELECT DISTINCT p.code
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = $1`,
      [user.id]
    );
    user.permissions = permsRes.rows.map((p) => p.code);

    // Fetch companies
    let companies = [];
    if (user.isOrgAdmin) {
      const compRes = await query(
        `SELECT id, name, code, logo_url, status FROM companies WHERE organization_id = $1 AND status = 'active' ORDER BY name`,
        [user.organization_id]
      );
      companies = compRes.rows;
    } else {
      const compRes = await query(
        `SELECT c.id, c.name, c.code, c.logo_url, c.status
         FROM user_company_access uca
         JOIN companies c ON c.id = uca.company_id
         WHERE uca.user_id = $1 AND c.status = 'active'
         ORDER BY c.name`,
        [user.id]
      );
      companies = compRes.rows;
    }
    user.companies = companies;

    // Student or Trainer reference
    if (user.user_type === 'student') {
      const stuRes = await query(`SELECT id, student_id_code, company_id, status FROM students WHERE user_id = $1`, [user.id]);
      user.student = stuRes.rows[0] || null;
    } else if (user.user_type === 'trainer') {
      const trnRes = await query(`SELECT id, trainer_id_code, company_id, status FROM trainers WHERE user_id = $1`, [user.id]);
      user.trainer = trnRes.rows[0] || null;
    }

    delete user.password_hash;

    // Sign JWT token
    const token = signToken({
      userId: user.id,
      organizationId: user.organization_id,
      email: user.email,
      userType: user.user_type,
    });

    const response = jsonSuccess({ user, token }, 'Sign in successful');

    // Set secure HttpOnly cookie
    response.cookies.set({
      name: 'lms_auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return jsonError(err.message, 500);
  }
}
