import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getBackendApiUrl } from '@/lib/auth-config';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      {
        message: 'Unauthorized',
      },
      {
        status: 401,
      },
    );
  }

  const backendResponse = await fetch(`${getBackendApiUrl()}/admin/overview`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const data = await backendResponse.json().catch(() => ({
    message: backendResponse.statusText,
  }));

  return NextResponse.json(data, {
    status: backendResponse.status,
  });
}