import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, getBackendApiUrl } from '@/lib/auth-config';
import { forwardBackendResponse } from '@/lib/api/forward-backend-response';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const body = await request.json();

  const response = await fetch(`${getBackendApiUrl()}/vendors/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  return forwardBackendResponse(response);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const response = await fetch(`${getBackendApiUrl()}/vendors/${id}`, {
    method: 'DELETE',
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
    cache: 'no-store',
  });

  return forwardBackendResponse(response);
}