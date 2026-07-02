'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Batch = {
  id: string;
  quantity: number;
  unitCost: number;
  expiryDate: string | null;
  receivedAt: string;
  purchaseOrder: { orderNumber: string; orderDate: string } | null;
};

type Props = {
  productId: string;
  productName: string;
};

export function ProductBatchesDialog({ productId, productName }: Props) {
  const [open, setOpen] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleOpen(o: boolean) {
    setOpen(o);
    if (o && batches.length === 0) {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}/batches`, {
          credentials: 'include',
        });
        const data = await res.json();
        setBatches(data.batches ?? []);
      } catch {
        setBatches([]);
      } finally {
        setIsLoading(false);
      }
    }
  }

  const now = new Date();

  function expiryBadge(expiryDate: string | null) {
    if (!expiryDate) return <span className="text-muted-foreground text-xs">No expiry</span>;
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return <Badge variant="destructive">Expired</Badge>;
    if (daysLeft <= 7) return <Badge variant="destructive">{daysLeft}d left</Badge>;
    if (daysLeft <= 30) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{daysLeft}d left</Badge>;
    return <Badge variant="secondary">{expiry.toLocaleDateString('en-IN')}</Badge>;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
          View batches
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Batches — {productName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 py-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No active batches. Batches are created when you record a purchase.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Purchase order</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Qty left</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Expiry</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Received</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">
                      {batch.purchaseOrder?.orderNumber ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{batch.quantity}</td>
                    <td className="px-3 py-2">{expiryBadge(batch.expiryDate)}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(batch.receivedAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}