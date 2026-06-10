import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { AUTH_COOKIE_NAME, getBackendApiUrl } from '@/lib/auth-config';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isAdminRole } from '@/lib/rbac';

type AdminOverview = {
  message: string;
  permissions: {
    canManageProducts: boolean;
    canManageStaff: boolean;
    canViewReports: boolean;
    canAccessAdminPanel: boolean;
  };
  stats: {
    totalProducts: number;
    lowStockItems: number;
    expiryAlerts: number;
    totalSalesToday: number;
  };
};

async function getAdminOverview(token: string): Promise<AdminOverview> {
  const response = await fetch(`${getBackendApiUrl()}/admin/overview`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Unable to load admin overview');
  }

  return response.json();
}

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (!isAdminRole(user.role)) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-xl border bg-background p-6 text-center shadow-sm">
          <h1 className="text-2xl font-bold">403 Forbidden</h1>
          <p className="mt-3 text-muted-foreground">
            You do not have permission to access the admin page.
          </p>
        </div>
      </main>
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login');
  }

  const overview = await getAdminOverview(token);

  return (
    <AppShell role={user.role} email={user.email}>
      <div className="rounded-xl border bg-background p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Admin Panel
        </p>

        <h2 className="mt-2 text-3xl font-bold tracking-tight">
          Role-Based Access Working
        </h2>

        <p className="mt-3 text-muted-foreground">{overview.message}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-5">
            <p className="text-sm text-muted-foreground">Products</p>
            <p className="mt-2 text-2xl font-bold">
              {overview.stats.totalProducts}
            </p>
          </div>

          <div className="rounded-lg border p-5">
            <p className="text-sm text-muted-foreground">Low stock</p>
            <p className="mt-2 text-2xl font-bold">
              {overview.stats.lowStockItems}
            </p>
          </div>

          <div className="rounded-lg border p-5">
            <p className="text-sm text-muted-foreground">Expiry alerts</p>
            <p className="mt-2 text-2xl font-bold">
              {overview.stats.expiryAlerts}
            </p>
          </div>

          <div className="rounded-lg border p-5">
            <p className="text-sm text-muted-foreground">Sales today</p>
            <p className="mt-2 text-2xl font-bold">
              {overview.stats.totalSalesToday}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border p-5">
          <h3 className="font-semibold">Admin Permissions</h3>

          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              Manage products:{' '}
              {overview.permissions.canManageProducts ? 'Yes' : 'No'}
            </li>
            <li>
              Manage staff: {overview.permissions.canManageStaff ? 'Yes' : 'No'}
            </li>
            <li>
              View reports: {overview.permissions.canViewReports ? 'Yes' : 'No'}
            </li>
            <li>
              Access admin panel:{' '}
              {overview.permissions.canAccessAdminPanel ? 'Yes' : 'No'}
            </li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}