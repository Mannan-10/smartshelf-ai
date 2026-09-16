'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { shelvesApi } from '@/lib/shelves-api';
import type { ShelfLocation, AuditResult } from '@/types/shelf';
import { ClipboardCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

type Props = {
  shelf: ShelfLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function ShelfAuditDialog({
  shelf,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [auditNotes, setAuditNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  // Initialize counts when shelf changes
  useEffect(() => {
    if (shelf?.products) {
      const initial: Record<string, number> = {};
      shelf.products.forEach((p) => {
        initial[p.id] = p.stock;
      });
      setCounts(initial);
      setResult(null);
      setError(null);
      setAuditNotes('');
    }
  }, [shelf]);

  if (!shelf) return null;

  const products = shelf.products || [];

  const handleCountChange = (productId: string, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setCounts((prev) => ({ ...prev, [productId]: num }));
  };

  const handleReconcile = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const items = products.map((p) => ({
        productId: p.id,
        countedQuantity: counts[p.id] ?? p.stock,
      }));

      const res = await shelvesApi.reconcileAudit(shelf.id, {
        items,
        notes: auditNotes.trim() || undefined,
      });

      setResult(res);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Audit reconciliation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-5">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <span>Physical Shelf Audit (Cycle Count)</span>
            </div>
            <Badge variant="outline" className="font-mono text-xs font-bold">
              {shelf.code}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Shelf location breadcrumb */}
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 pb-2 border-b">
          <span>{shelf.aisle}</span>
          <ArrowRight className="h-3 w-3" />
          <span>{shelf.rack}</span>
          <ArrowRight className="h-3 w-3" />
          <span>{shelf.shelf}</span>
          {shelf.bin && (
            <>
              <ArrowRight className="h-3 w-3" />
              <span>{shelf.bin}</span>
            </>
          )}
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-md">
            {error}
          </div>
        )}

        {/* Post-Audit Success Banner */}
        {result ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>Audit Reconciliation Complete!</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Reconciled {result.totalItemsCounted} items on shelf {result.shelfCode}.{' '}
                {result.itemsAdjustedCount > 0 ? (
                  <span className="font-semibold text-foreground">
                    Adjusted {result.itemsAdjustedCount} discrepancies (Net variance: {result.netVariance > 0 ? `+${result.netVariance}` : result.netVariance} units).
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium">100% accurate count — zero variances found!</span>
                )}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No products are currently assigned to this shelf. Assign products from the product catalog first.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden divide-y text-xs">
                <div className="bg-muted/40 grid grid-cols-12 px-3 py-2 font-bold text-muted-foreground uppercase text-[10px]">
                  <span className="col-span-6">Product / SKU</span>
                  <span className="col-span-3 text-center">System</span>
                  <span className="col-span-3 text-right">Physical Count</span>
                </div>

                {products.map((product) => {
                  const counted = counts[product.id] ?? product.stock;
                  const variance = counted - product.stock;

                  return (
                    <div key={product.id} className="grid grid-cols-12 px-3 py-2.5 items-center gap-2">
                      <div className="col-span-6">
                        <div className="font-semibold truncate text-foreground">{product.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          SKU: {product.sku}
                        </div>
                      </div>

                      <div className="col-span-3 text-center font-mono font-medium">
                        {product.stock}
                      </div>

                      <div className="col-span-3 flex flex-col items-end gap-1">
                        <Input
                          type="number"
                          min="0"
                          value={counted}
                          onChange={(e) => handleCountChange(product.id, e.target.value)}
                          className="h-8 w-20 text-right font-mono font-bold text-xs"
                        />
                        {variance !== 0 && (
                          <span
                            className={`text-[10px] font-bold ${
                              variance < 0 ? 'text-destructive' : 'text-blue-600'
                            }`}
                          >
                            {variance > 0 ? `+${variance} surplus` : `${variance} missing`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {products.length > 0 && (
              <div className="space-y-2">
                <Input
                  placeholder="Optional audit notes (e.g. Monthly Physical Verification)..."
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  className="h-8 text-xs"
                />

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReconcile}
                    disabled={isSubmitting}
                    className="text-xs gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Apply Reconciliation</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
