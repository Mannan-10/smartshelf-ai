'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { alertsApi, type LowStockProduct, type ExpiringProduct } from '@/lib/alerts-api';

type Tab = 'low-stock' | 'expiring';

export function AlertsManager() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'low-stock');
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [expiring, setExpiring] = useState<ExpiringProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ls, ex] = await Promise.all([
        alertsApi.getLowStock(),
        alertsApi.getExpiring(30),
      ]);
      setLowStock(ls || []);
      setExpiring(ex || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Products that need your attention
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
        {(['low-stock', 'expiring'] as Tab[]).map((t) => {
          const count = t === 'low-stock' ? lowStock.length : expiring.length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'low-stock' ? 'Low Stock' : 'Expiring'}
              {!isLoading && count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  t === 'low-stock'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Low stock table */}
      {tab === 'low-stock' && (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          {isLoading ? <SkeletonRows /> : lowStock.length === 0 ? (
            <EmptyState icon="✅" message="All products are sufficiently stocked." />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Stock</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Reorder level</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-600">{p.stock}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{p.reorderLevel}</td>
                    <td className="px-4 py-3">
                      {p.stock === 0
                        ? <Badge color="red">Out of stock</Badge>
                        : <Badge color="amber">Low stock</Badge>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Expiring table */}
      {tab === 'expiring' && (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          {isLoading ? <SkeletonRows /> : expiring.length === 0 ? (
            <EmptyState icon="✅" message="No products expiring in the next 30 days." />
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Stock</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expiry date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {expiring.map((p) => {
                  const expiry = new Date(p.expiryDate);
                  const isExpired = expiry < now;
                  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.sku}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-right">{p.stock}</td>
                      <td className="px-4 py-3">{expiry.toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        {isExpired
                          ? <Badge color="red">Expired</Badge>
                          : daysLeft <= 7
                          ? <Badge color="red">{daysLeft}d left</Badge>
                          : <Badge color="amber">{daysLeft}d left</Badge>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ color, children }: { color: 'red' | 'amber'; children: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
      color === 'red'
        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
    }`}>
      {children}
    </span>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <p className="py-12 text-center text-sm text-muted-foreground">
      {icon} {message}
    </p>
  );
}

function SkeletonRows() {
  return (
    <div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-4 last:border-0">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-3 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}