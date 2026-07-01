import { forwardBackendResponse } from '@/lib/api/forward-backend-response';
import { getCurrentUser } from '@/lib/auth/current-user';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, getBackendApiUrl } from '@/lib/auth-config';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const path = slug.join('/');
  const search = req.nextUrl.search;

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const res = await fetch(`${getBackendApiUrl()}/alerts/${path}${search}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
    cache: 'no-store',
  });
  return forwardBackendResponse(res);
}