import { forwardBackendResponse } from '@/lib/api/forward-backend-response';
import { getCurrentUser } from '@/lib/auth/current-user';
import { NextRequest } from 'next/server';
import { getBackendApiUrl } from '@/lib/auth-config';

export async function GET() {
    const user = await getCurrentUser();
    if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 });
    const token = 'accessToken' in user ? user.accessToken : user.sub;

    const res = await fetch(`${getBackendApiUrl()}/purchases`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return forwardBackendResponse(res);
}

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 });
    const token = 'accessToken' in user ? user.accessToken : user.sub;

    const body = await req.json();
    const res = await fetch(`${getBackendApiUrl()}/purchases`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    return forwardBackendResponse(res);
}   