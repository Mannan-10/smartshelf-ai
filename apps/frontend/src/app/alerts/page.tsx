import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { AlertsManager } from '@/components/alerts/alerts-manager';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <AppShell role={user.role} email={user.email}>
      <Suspense>
        <AlertsManager />
      </Suspense>
    </AppShell>
  );
}