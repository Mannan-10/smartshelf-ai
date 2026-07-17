'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { productsApi } from '@/lib/products-api';
import type { Product } from '@/types/product';
import { AdjustStockDialog } from './adjust-stock-dialog';

type Batch = {
  id: string;
  quantity: number;
  unitCost: number;
  expiryDate: string | null;
  receivedAt: string;
  purchaseOrder: { orderNumber: string; orderDate: string } | null;
};

type ProductWithBatches = Product & { batches?: Batch[] };

const now = new Date();

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return <span className="text-xs text-muted-foreground">—</span>;
  const days = daysUntil(expiryDate);
  if (days < 0) return <Badge variant="destructive">Expired</Badge>;
  if (days <= 7) return <Badge variant="destructive">{days}d left</Badge>;
  if (days <= 30) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{days}d left</Badge>;
  return <span className="text-sm">{new Date(expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>;
}

export function InventoryManager() {
  const [products, setProducts] = useState<ProductWithBatches[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [batchesCache, setBatchesCache] = useState<Record<string, Batch[]>>({});
  const [batchLoading, setBatchLoading] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsApi.getProducts();
      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  async function toggleBatches(productId: string) {
    if (expandedId === productId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(productId);
    if (batchesCache[productId]) return; // already loaded

    setBatchLoading(productId);
    try {
      const res = await fetch(`/api/products/${productId}/batches`, { credentials: 'include' });
      const data = await res.json();
      setBatchesCache((prev) => ({ ...prev, [productId]: data.batches ?? [] }));
    } catch {
      setBatchesCache((prev) => ({ ...prev, [productId]: [] }));
    } finally {
      setBatchLoading(null);
    }
  }

  const lowStockCount = products.filter((p) => p.stock <= p.reorderLevel).length;
  const expiringCount = products.filter(
    (p) => p.expiryDate && daysUntil(p.expiryDate) <= 30
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stock levels, batch tracking, and expiry dates per product
        </p>
      </div>

      {/* Stat cards */}
      {!isLoading && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Total products</p>
            <p className="mt-1 text-2xl font-bold">{products.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">in catalog</p>
          </div>
          <div className="rounded-xl border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Low / out of stock</p>
            <p className={`mt-1 text-2xl font-bold ${lowStockCount > 0 ? 'text-amber-600' : ''}`}>
              {lowStockCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">need reordering</p>
          </div>
          <div className="rounded-xl border bg-background p-5 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Expiring soon</p>
            <p className={`mt-1 text-2xl font-bold ${expiringCount > 0 ? 'text-red-600' : ''}`}>
              {expiringCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">within 30 days</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <SkeletonTable />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Reorder level</TableHead>
                <TableHead>Expiry (product)</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const isLowStock = product.stock <= product.reorderLevel;
                const isExpanded = expandedId === product.id;
                const batches = batchesCache[product.id] ?? [];
                const isLoadingBatches = batchLoading === product.id;

                return (
                  <Fragment key={product.id}>
                    <TableRow className={isExpanded ? 'bg-muted/20' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.category?.name ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={isLowStock ? 'font-semibold text-amber-600' : ''}>
                            {product.stock}
                          </span>
                          {isLowStock && <Badge variant="destructive">Low</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{product.reorderLevel}</TableCell>
                      <TableCell>
                        <ExpiryBadge expiryDate={product.expiryDate ?? null} />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleBatches(product.id)}
                          className="text-xs text-primary underline-offset-2 hover:underline"
                        >
                          {isLoadingBatches
                            ? 'Loading...'
                            : isExpanded
                            ? 'Hide batches'
                            : 'View batches'}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <AdjustStockDialog
                          productId={product.id}
                          productName={product.name}
                          currentStock={product.stock}
                          onSuccess={loadProducts}
                        />
                      </TableCell>
                    </TableRow>

                    {/* Expanded batch rows */}
                    {isExpanded && (
                      <TableRow key={`${product.id}-batches`} className="bg-muted/10 hover:bg-muted/10">
                        <TableCell colSpan={7} className="px-8 py-3">
                          {batches.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              No active batches. Batches are created when you record a purchase with an expiry date.
                            </p>
                          ) : (
                            <div className="overflow-hidden rounded-lg border">
                              <table className="w-full text-xs">
                                <thead className="border-b bg-muted/30">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Purchase order</th>
                                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qty remaining</th>
                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Expiry</th>
                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Received</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {batches.map((batch) => (
                                    <tr key={batch.id} className="border-b last:border-0">
                                      <td className="px-3 py-2 font-mono">
                                        {batch.purchaseOrder?.orderNumber ?? '—'}
                                      </td>
                                      <td className="px-3 py-2 text-right font-semibold">{batch.quantity}</td>
                                      <td className="px-3 py-2">
                                        <ExpiryBadge expiryDate={batch.expiryDate} />
                                      </td>
                                      <td className="px-3 py-2 text-muted-foreground">
                                        {new Date(batch.receivedAt).toLocaleDateString('en-IN', {
                                          day: '2-digit', month: 'short', year: 'numeric',
                                        })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="border-b px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
      {[...Array(5)].map((_, i) => (
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