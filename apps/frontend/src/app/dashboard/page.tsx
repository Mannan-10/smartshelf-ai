import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isAdminRole } from '@/lib/rbac';
import { LogoutButton } from '@/components/ui/logout-button';
import { AlertsBanner } from '@/components/alerts/alerts-banner';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const adminUser = isAdminRole(user.role);

  return (
    <AppShell role={user.role} email={user.email}>
      <div className="rounded-xl border bg-background p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Welcome back
        </p>

        <h2 className="mt-2 text-3xl font-bold tracking-tight">
          {adminUser ? 'Admin Dashboard' : 'Staff Dashboard'}
        </h2>

        <p className="mt-3 text-muted-foreground">
          {adminUser
            ? 'You can access all menus, reports, settings, and admin controls.'
            : 'You have limited access to daily inventory, sales, and product operations.'}
        </p>

        <AlertsBanner />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-5">
            <p className="text-sm text-muted-foreground">Products</p>
            <p className="mt-2 text-2xl font-bold">0</p>
          </div>

          <div className="rounded-lg border p-5">
            <p className="text-sm text-muted-foreground">Low stock</p>
            <p className="mt-2 text-2xl font-bold">0</p>
          </div>

          <div className="rounded-lg border p-5">
            <p className="text-sm text-muted-foreground">Expiry alerts</p>
            <p className="mt-2 text-2xl font-bold">0</p>
          </div>
        </div>
        <LogoutButton/>
      </div>
    </AppShell>
  );
}