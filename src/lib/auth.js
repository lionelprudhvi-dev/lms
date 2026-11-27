import jwt from 'jsonwebtoken';
import { query } from './db/index.js';

let nextCookies = null;
try {
  const nh = require('next/headers');
  nextCookies = nh.cookies;
} catch (e) {
  // Outside Next.js environment
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-enterprise-lms-2026-production-grade';
const COOKIE_NAME = 'lms_auth_token';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser(request = null) {
  let token = null;

  // 1. Try reading from Request cookies if passed
  if (request && request.cookies && typeof request.cookies.get === 'function') {
    token = request.cookies.get(COOKIE_NAME)?.value;
  }

  // 2. Try Next.js next/headers cookies()
  if (!token && nextCookies) {
    try {
      const cookieStore = nextCookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch (e) {
      // Outside request context
    }
  }

  // 3. Fallback to Authorization Header (Bearer token)
  if (!token && request && request.headers) {
    const authHeader = typeof request.headers.get === 'function' 
      ? request.headers.get('authorization')
      : request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) return null;

  // Fetch fresh user data with roles and company access
  const userRes = await query(
    `SELECT u.id, u.organization_id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.user_type, u.is_active,
            o.name as organization_name, o.code as organization_code
     FROM users u
     JOIN organizations o ON o.id = u.organization_id
     WHERE u.id = $1 AND u.is_active = true`,
    [decoded.userId]
  );

  if (userRes.rows.length === 0) return null;
  const user = userRes.rows[0];

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

  // Fetch permitted companies
  if (user.isOrgAdmin) {
    const allCompRes = await query(
      `SELECT id, name, code, logo_url, status FROM companies WHERE organization_id = $1 AND status = 'active' ORDER BY name`,
      [user.organization_id]
    );
    user.companies = allCompRes.rows;
  } else {
    const compRes = await query(
      `SELECT c.id, c.name, c.code, c.logo_url, c.status
       FROM user_company_access uca
       JOIN companies c ON c.id = uca.company_id
       WHERE uca.user_id = $1 AND c.status = 'active'
       ORDER BY c.name`,
      [user.id]
    );
    user.companies = compRes.rows;
  }

  // Fetch linked student or trainer record if applicable
  if (user.user_type === 'student') {
    const stuRes = await query(
      `SELECT id, student_id_code, company_id, status FROM students WHERE user_id = $1`,
      [user.id]
    );
    user.student = stuRes.rows[0] || null;
  } else if (user.user_type === 'trainer') {
    const trnRes = await query(
      `SELECT id, trainer_id_code, company_id, status FROM trainers WHERE user_id = $1`,
      [user.id]
    );
    user.trainer = trnRes.rows[0] || null;
  }

  return user;
}

export function checkPermission(user, requiredPermission) {
  if (!user) return false;
  if (user.isOrgAdmin) return true; // Org admin has wildcard permission
  return user.permissions && user.permissions.includes(requiredPermission);
}

export function checkCompanyAccess(user, companyId) {
  if (!user || !companyId) return false;
  if (user.isOrgAdmin) return true;
  return user.companies && user.companies.some((c) => c.id === companyId);
}
