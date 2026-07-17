'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/app-shell';
import { AlertsBanner } from '@/components/alerts/alerts-banner';
import { Badge } from '@/components/ui/badge';
import type { DashboardSummary } from '@/types/dashboard';
import { SalesTrendChart } from './SalesTrendChart';
import { TopProductsChart } from './TopProductsChart';

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  color = 'default',
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: 'default' | 'amber' | 'red' | 'green' | 'blue' | 'purple';
  icon: React.ReactNode;
}) {
  const colorMap = {
    default: 'bg-muted text-foreground',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    purple: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  };

  return (
    <div className="rounded-xl border bg-background p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2 ${colorMap[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const Icons = {
  box: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" /></svg>,
  warn: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>,
  clock: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>,
  rupee: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" /></svg>,
  chart: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M9 17V9m4 8v-5m4 5V5" /></svg>,
  receipt: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" /></svg>,
};

function fmt(amount: number) {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

import type { AppRole } from '@/lib/rbac';

// ── Main dashboard client component ───────────────────────────────────────────
function DashboardContent({ role, email }: { role: AppRole; email: string }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/summary', { credentials: 'include' });
      const json = await res.json();
      setData(json);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const isAdmin = role === 'OWNER' || role === 'ADMIN';

  return (
    <AppShell role={role} email={email}>
      <div className="space-y-6">

        {/* Welcome */}
        <div>
          <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">
            {isAdmin ? 'Admin Dashboard' : 'Staff Dashboard'}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {isAdmin
              ? 'Full access to reports, settings, and admin controls.'
              : 'Access to daily inventory, sales, and product operations.'}
          </p>
        </div>

        {/* Alerts banner */}
        <AlertsBanner />

        {/* Metric cards */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">{error}</div>
        ) : data && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total products" value={String(data.products.total)} sub="in catalog" color="blue" icon={Icons.box} />
            <StatCard label="Low stock items" value={String(data.products.lowStock)} sub="need reordering" color={data.products.lowStock > 0 ? 'amber' : 'default'} icon={Icons.warn} />
            <StatCard label="Expiring soon" value={String(data.products.expiring)} sub="within 30 days" color={data.products.expiring > 0 ? 'red' : 'default'} icon={Icons.clock} />
            <StatCard label="Total revenue" value={fmt(data.sales.allTime.revenue)} sub="all time" color="green" icon={Icons.rupee} />
            <StatCard label="This month revenue" value={fmt(data.sales.thisMonth.revenue)} sub={`${data.sales.thisMonth.count} sales`} color="green" icon={Icons.chart} />
            <StatCard label="Total sales" value={String(data.sales.allTime.count)} sub="all time invoices" color="purple" icon={Icons.receipt} />
          </div>
        )}

        {/* Bottom grid: top products + recent sales */}
        {!isLoading && data && (
          <div className="space-y-6">

            {/* Charts row */}
            <div className="grid gap-6 lg:grid-cols-2">
              <SalesTrendChart />
              <TopProductsChart data={data.topProducts} />
            </div>

            {/* Tables row */}
            <div className="grid gap-6 lg:grid-cols-2">

              {/* Top products table */}
              <div className="rounded-xl border bg-background shadow-sm">
                <div className="border-b px-5 py-4">
                  <h3 className="font-semibold">Top products by sales</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">By quantity sold, all time</p>
                </div>
                {data.topProducts.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">No sales recorded yet.</p>
                ) : (
                  <div className="divide-y">
                    {data.topProducts.map((p, i) => (
                      <div key={p.productId} className="flex items-center gap-4 px-5 py-3">
                        <span className="w-5 text-sm font-bold text-muted-foreground">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{p.totalQuantitySold} units</p>
                          <p className="text-xs text-muted-foreground">{fmt(p.totalRevenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent sales table */}
              <div className="rounded-xl border bg-background shadow-sm">
                <div className="border-b px-5 py-4">
                  <h3 className="font-semibold">Recent sales</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Last 5 invoices</p>
                </div>
                {data.recentSales.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">No sales recorded yet.</p>
                ) : (
                  <div className="divide-y">
                    {data.recentSales.map((s) => (
                      <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium font-mono text-sm">{s.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {s.items.map((i) => `${i.product.name} ×${i.quantity}`).join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{fmt(s.totalAmount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}

export default DashboardContent;