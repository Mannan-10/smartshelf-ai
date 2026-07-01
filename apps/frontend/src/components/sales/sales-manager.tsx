'use client';

import type { Sale } from '@/types/sale';
import type { Product } from '@/types/product';

import { useState, useCallback, useEffect } from 'react';
import { salesApi } from '@/lib/sales-api';
import { productsApi } from '@/lib/products-api';
import { AddSaleDialog } from './add-sale-dialog';
import { SaleTable } from './sale-table';

export function SalesManager() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [salesResponse, productsResponse] = await Promise.all([
                salesApi.getSales(),
                productsApi.getProducts(),
            ]);
            setSales(salesResponse || []);
            setProducts(productsResponse || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load sales data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const totalItems = sales.reduce((sum, s) => sum + s.items.length, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Record outgoing stock and billing
                    </p>
                </div>
                {!isLoading && (
                    <AddSaleDialog
                        products={products}
                        onSuccess={loadData}
                    />
                )}
            </div>

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    label="Total Sales"
                    value={isLoading ? '—' : String(sales.length)}
                    sub="all time"
                    color="blue"
                    icon={
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Total Revenue"
                    value={isLoading ? '—' : `₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    sub="across all sales"
                    color="green"
                    icon={
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
                        </svg>
                    }
                />
                <StatCard
                    label="Items Sold"
                    value={isLoading ? '—' : String(totalItems)}
                    sub="line items total"
                    color="purple"
                    icon={
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                        </svg>
                    }
                />
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                    <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Table */}
            {isLoading ? (
                <SkeletonTable />
            ) : (
                <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
                    <SaleTable sales={sales} />
                </div>
            )}
        </div>
    );
}

/* ── Stat Card ── */
function StatCard({
    label,
    value,
    sub,
    color,
    icon,
}: {
    label: string;
    value: string;
    sub: string;
    color: 'blue' | 'green' | 'purple';
    icon: React.ReactNode;
}) {
    const colorMap = {
        blue:   'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
        green:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
        purple: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
    };

    return (
        <div className="rounded-xl border bg-background p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
                </div>
                <div className={`rounded-lg p-2 ${colorMap[color]}`}>{icon}</div>
            </div>
        </div>
    );
}

/* ── Skeleton Loader ── */
function SkeletonTable() {
    return (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
            <div className="border-b px-4 py-3">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </div>
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b px-4 py-4 last:border-0">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                    <div className="ml-auto h-3 w-20 animate-pulse rounded bg-muted" />
                </div>
            ))}
        </div>
    );
}