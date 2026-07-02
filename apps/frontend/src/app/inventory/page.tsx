import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import { AppShell } from '@/components/app-shell';
import { InventoryManager } from '@/components/inventory/inventory-manager';

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <AppShell role={user.role} email={user.email}>
      <InventoryManager />
    </AppShell>
  );
}