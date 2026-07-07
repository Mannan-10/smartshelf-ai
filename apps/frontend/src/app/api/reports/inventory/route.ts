import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, getBackendApiUrl } from '@/lib/auth-config';
import { getCurrentUser } from '@/lib/auth/current-user';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 });

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const res = await fetch(`${getBackendApiUrl()}/reports/inventory`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const csv = await res.text();
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="inventory-report-${date}.csv"`,
    },
  });
}
