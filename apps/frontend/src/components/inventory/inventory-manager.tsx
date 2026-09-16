'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { productsApi } from '@/lib/products-api';
import { shelvesApi } from '@/lib/shelves-api';
import type { Product } from '@/types/product';
import type { ShelfLocation } from '@/types/shelf';
import { AdjustStockDialog } from './adjust-stock-dialog';
import { ShelfPlanogram } from './shelf-planogram';
import { Package, Layers, MapPin } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'catalog' | 'shelves'>('shelves');
  const [products, setProducts] = useState<ProductWithBatches[]>([]);
  const [shelves, setShelves] = useState<ShelfLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [batchesCache, setBatchesCache] = useState<Record<string, Batch[]>>({});
  const [batchLoading, setBatchLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productsData, shelvesData] = await Promise.all([
        productsApi.getProducts().catch(() => []),
        shelvesApi.getShelves().catch(() => []),
      ]);
      setProducts(productsData || []);
      setShelves(shelvesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function toggleBatches(productId: string) {
    if (expandedId === productId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(productId);
    if (batchesCache[productId]) return;

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
      {/* View Switcher Tabs */}
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab('shelves')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
            activeTab === 'shelves'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Spatial Shelf Planogram</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {shelves.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
            activeTab === 'catalog'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Products & Batches</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {products.length}
          </Badge>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Tab 1: Spatial Shelf Planogram */}
      {activeTab === 'shelves' && (
        <ShelfPlanogram shelves={shelves} onRefresh={loadData} />
      )}

      {/* Tab 2: Products & Batches Table */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold tracking-tight">Product Stock & Batches</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Stock levels, physical shelf assignments, and FIFO/FEFO expiry tracking.
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
                    <TableHead>Shelf Location</TableHead>
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
                              <p className="font-medium text-sm">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell>
                            {product.shelfLocation ? (
                              <Badge variant="outline" className="font-mono text-xs gap-1">
                                <MapPin className="h-3 w-3 text-primary" />
                                <span>{product.shelfLocation.code}</span>
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {product.category?.name ?? '—'}
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold text-sm ${isLowStock ? 'text-destructive' : ''}`}>
                              {product.stock}
                            </span>
                            {isLowStock && (
                              <Badge variant="destructive" className="ml-2 text-xs">Low</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {product.reorderLevel}
                          </TableCell>
                          <TableCell>
                            <ExpiryBadge expiryDate={product.expiryDate ?? null} />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 gap-1"
                              onClick={() => toggleBatches(product.id)}
                            >
                              <span>{isExpanded ? 'Hide' : 'View batches'}</span>
                              <svg
                                className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">
                            <AdjustStockDialog
                              productId={product.id}
                              productName={product.name}
                              currentStock={product.stock}
                              onSuccess={loadData}
                            />
                          </TableCell>
                        </TableRow>

                        {/* Expandable batch details */}
                        {isExpanded && (
                          <TableRow className="bg-muted/10">
                            <TableCell colSpan={9} className="p-0">
                              <div className="px-6 py-4 border-b border-t">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                  Batches for {product.name} (FEFO order)
                                </p>
                                {isLoadingBatches ? (
                                  <div className="py-4 text-xs text-muted-foreground animate-pulse">Loading batches...</div>
                                ) : batches.length === 0 ? (
                                  <p className="text-xs text-muted-foreground py-2 italic">
                                    No active batches recorded. Batches are created automatically on purchase order reception.
                                  </p>
                                ) : (
                                  <div className="rounded-lg border bg-background overflow-hidden text-xs">
                                    <div className="grid grid-cols-5 gap-4 bg-muted/40 px-4 py-2 font-medium text-muted-foreground border-b text-[11px]">
                                      <span>PO / Source</span>
                                      <span>Received</span>
                                      <span>Unit Cost</span>
                                      <span>Quantity</span>
                                      <span>Expiry Date</span>
                                    </div>
                                    <div className="divide-y">
                                      {batches.map((b) => (
                                        <div key={b.id} className="grid grid-cols-5 gap-4 px-4 py-2.5 items-center">
                                          <span className="font-mono text-muted-foreground">
                                            {b.purchaseOrder ? `#${b.purchaseOrder.orderNumber}` : 'Direct batch'}
                                          </span>
                                          <span className="text-muted-foreground">
                                            {new Date(b.receivedAt).toLocaleDateString('en-IN')}
                                          </span>
                                          <span>₹{Number(b.unitCost).toFixed(2)}</span>
                                          <span className="font-semibold">{b.quantity} pcs</span>
                                          <div>
                                            <ExpiryBadge expiryDate={b.expiryDate} />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
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
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}