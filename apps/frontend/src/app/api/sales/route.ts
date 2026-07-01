import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, getBackendApiUrl } from '@/lib/auth-config';
import { forwardBackendResponse } from '@/lib/api/forward-backend-response';
import { getCurrentUser } from '@/lib/auth/current-user';
import { NextRequest } from 'next/server';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 });

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    const res = await fetch(`${getBackendApiUrl()}/sales`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });
    return forwardBackendResponse(res);
}

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 });

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    const body = await req.json();
    const res = await fetch(`${getBackendApiUrl()}/sales`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
    });
    return forwardBackendResponse(res);
}