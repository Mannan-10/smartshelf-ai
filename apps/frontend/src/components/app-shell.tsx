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
  storeName?: string | null;
  children: ReactNode;
};

export function AppShell({ role, email, storeName, children }: AppShellProps) {
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
                SmartShelf AI {storeName ? `• ${storeName}` : ''}
              </p>
              <h1 className="text-lg font-bold sm:text-xl">
                {storeName || 'Inventory Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {storeName && (
              <span className="hidden items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary md:inline-flex">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                {storeName}
              </span>
            )}
            <span className="hidden font-medium text-foreground sm:block">{email}</span>
            <span className="hidden sm:inline-block mx-1">•</span>
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

      {/* Desktop Navigation */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <nav className="hidden overflow-x-auto pb-4 lg:block">
          <div className="flex gap-2">
            {menus.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-lg border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Content Area */}
        <section className="mt-2">{children}</section>
      </div>
    </main>
  );
}