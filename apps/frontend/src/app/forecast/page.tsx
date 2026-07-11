import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { AppShell } from '@/components/app-shell';
import { ForecastManager } from '@/components/forecast/forecast-manager';

export default async function ForecastPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <AppShell role={user.role} email={user.email}>
      <ForecastManager />
    </AppShell>
  );
}