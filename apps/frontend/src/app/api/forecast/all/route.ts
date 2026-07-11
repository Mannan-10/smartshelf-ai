import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, getBackendApiUrl } from '@/lib/auth-config';
import { forwardBackendResponse } from '@/lib/api/forward-backend-response';
import { getCurrentUser } from '@/lib/auth/current-user';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const res = await fetch(`${getBackendApiUrl()}/forecast/all`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  return forwardBackendResponse(res);
}
