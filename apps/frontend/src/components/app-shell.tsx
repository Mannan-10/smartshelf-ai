'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getNavigationItemsForRole, type AppRole } from '@/lib/rbac';
import { LogoutButton } from '@/components/ui/logout-button';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AppShellProps = {
  role: AppRole;
  email: string;
  children: ReactNode;
};

export function AppShell({ role, email, children }: AppShellProps) {
  const menus = getNavigationItemsForRole(role);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-muted/40 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
            <div>
              <p className="hidden text-xs font-medium text-muted-foreground sm:block">
                SmartShelf AI
              </p>
              <h1 className="text-lg font-bold sm:text-xl">Inventory Dashboard</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden font-medium text-foreground sm:block">{email}</span>
            <span className="hidden sm:inline-block mx-2">•</span>
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs">
              {role}
            </span>
            <span className="ml-1 sm:ml-2">
              <LogoutButton />
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 mt-[60px] h-[calc(100vh-60px)] overflow-y-auto bg-background p-4 lg:hidden">
          <nav className="space-y-2 pb-10">
            {menus.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg border px-4 py-3 transition hover:bg-muted active:bg-muted"
              >
                <span className="block font-medium">{item.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {item.description}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[260px_1fr]">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block rounded-xl border bg-background p-4 shadow-sm h-fit sticky top-[100px]">
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

        {/* Page Content */}
        <section className="min-w-0 overflow-hidden">
          {children}
        </section>
      </div>
    </main>
  );
}