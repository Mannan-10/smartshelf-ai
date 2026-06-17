import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { VendorsManager } from '@/components/vendors/vendors-manager';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function VendorsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <AppShell role={user.role} email={user.email}>
      <VendorsManager />
    </AppShell>
  );
}