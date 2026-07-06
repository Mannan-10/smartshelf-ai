import Link from 'next/link';
import type { ReactNode } from 'react';
import { getNavigationItemsForRole, type AppRole } from '@/lib/rbac';
import { LogoutButton } from '@/components/ui/logout-button';
type AppShellProps = {
  role: AppRole;
  email: string;
  children: ReactNode;
};

export function AppShell({ role, email, children }: AppShellProps) {
  const menus = getNavigationItemsForRole(role);

  return (
    <main className="min-h-screen bg-muted/40">
      <div className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              SmartShelf AI
            </p>
            <h1 className="text-xl font-bold">Inventory Dashboard</h1>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{email}</span>
            <span className="mx-2">•</span>
            <span className="rounded-full border px-3 py-1 text-xs font-semibold">
              {role}
            </span>
            <span className="ml-2">
              <LogoutButton />
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border bg-background p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
            Menus
          </h2>

          <nav className="space-y-2">
            {menus.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg border px-4 py-3 transition hover:bg-muted"
              >
                <span className="block font-medium">{item.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {item.description}
                </span>
              </Link>
            ))}
          </nav>
        </aside>

        <section>{children}</section>
      </div>
    </main>
  );
}