import { NextResponse } from 'next/server';
import { jsonSuccess } from '@/lib/api-response';

export async function POST() {
  const response = jsonSuccess(null, 'Logged out successfully');
  response.cookies.set({
    name: 'lms_auth_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
