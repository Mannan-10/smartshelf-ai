import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { PurchasesManager } from '@/components/purchases/purchases-manager';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function PurchasesPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <AppShell role={user.role} email={user.email}>
            <PurchasesManager />
        </AppShell>
    );
}