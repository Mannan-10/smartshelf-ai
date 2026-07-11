import { forwardBackendResponse } from '@/lib/api/forward-backend-response';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth/current-user';
import { AUTH_COOKIE_NAME, getBackendApiUrl } from '@/lib/auth-config';
import { NextRequest } from 'next/server';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const res = await fetch(`${getBackendApiUrl()}/forecast/product/${id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return forwardBackendResponse(res);
}