import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { SettingsManager } from '@/components/settings/settings-manager';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Double check role
  if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <AppShell role={user.role} email={user.email}>
      <SettingsManager />
    </AppShell>
  );
}
