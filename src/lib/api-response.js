import { NextResponse } from 'next/server';
import { getCurrentUser, checkPermission, checkCompanyAccess } from './auth.js';

export function jsonSuccess(data = null, message = null, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

export function jsonError(message = 'An unexpected error occurred', status = 400, details = null) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
    },
    { status }
  );
}

export async function authorizeRequest(request, options = {}) {
  const user = await getCurrentUser(request);
  if (!user) {
    return {
      authorized: false,
      response: jsonError('Authentication required. Please sign in.', 401),
    };
  }

  // Permission check
  if (options.permission) {
    const hasPerm = checkPermission(user, options.permission);
    if (!hasPerm) {
      return {
        authorized: false,
        response: jsonError(`Forbidden: Missing permission [${options.permission}]`, 403),
      };
    }
  }

  // User type check (e.g. ['admin', 'company_admin'])
  if (options.allowedUserTypes && options.allowedUserTypes.length > 0) {
    if (!options.allowedUserTypes.includes(user.user_type) && !user.isOrgAdmin) {
      return {
        authorized: false,
        response: jsonError('Forbidden: Access restricted by user role.', 403),
      };
    }
  }

  // Company access check if companyId is passed
  if (options.companyId) {
    const hasCompAccess = checkCompanyAccess(user, options.companyId);
    if (!hasCompAccess) {
      return {
        authorized: false,
        response: jsonError('Forbidden: You do not have access to this company.', 403),
      };
    }
  }

  return {
    authorized: true,
    user,
  };
}
