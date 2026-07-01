import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { SalesManager } from '@/components/sales/sales-manager';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function SalesPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <AppShell role={user.role} email={user.email}>
            <SalesManager />
        </AppShell>
    );
}