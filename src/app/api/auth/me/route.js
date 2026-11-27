import { authorizeRequest, jsonSuccess, jsonError } from '@/lib/api-response';

export async function GET(request) {
  try {
    const auth = await authorizeRequest(request);
    if (!auth.authorized) return auth.response;

    return jsonSuccess({ user: auth.user });
  } catch (err) {
    return jsonError(err.message, 500);
  }
}
