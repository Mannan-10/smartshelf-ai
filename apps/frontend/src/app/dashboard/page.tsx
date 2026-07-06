import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import DashboardContent from '@/components/dashboard/dashboard-content';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <DashboardContent role={user.role} email={user.email} />;
}