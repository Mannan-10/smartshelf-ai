import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { AppShell } from '@/components/app-shell';
import { ReportsManager } from '@/components/reports/reports-manager';
import { isAdminRole } from '@/lib/rbac';

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  if (!isAdminRole(user.role)) {
    redirect('/dashboard');
  }

  return (
    <AppShell role={user.role} email={user.email}>
      <ReportsManager />
    </AppShell>
  );
}