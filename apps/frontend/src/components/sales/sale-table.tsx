'use client';

import { useState } from 'react';
import type { Sale } from '@/types/sale';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReceiptDialog } from './receipt-dialog';
import { Printer, User } from 'lucide-react';

type SaleTableProps = {
  sales: Sale[];
  onSelectSaleForReceipt?: (sale: Sale) => void;
};

export function SaleTable({ sales }: SaleTableProps) {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  if (sales.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No sales yet. Record your first sale above.
      </p>
    );
  }

  const handleOpenReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setReceiptOpen(true);
  };

  const getPaymentBadge = (method?: string) => {
    switch (method?.toUpperCase()) {
      case 'UPI':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">UPI / QR</Badge>;
      case 'CARD':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">Card</Badge>;
      case 'CREDIT':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Store Credit</Badge>;
      default:
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">Cash</Badge>;
    }
  };

  return (
    <>
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-semibold text-sm font-mono">{s.invoiceNumber}</TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(s.saleDate || s.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell className="text-sm">
                {s.customerName ? (
                  <div>
                    <div className="font-medium text-foreground">{s.customerName}</div>
                    {s.customerPhone && (
                      <div className="text-xs text-muted-foreground font-mono">{s.customerPhone}</div>
                    )}
                  </div>
                ) : s.customerPhone ? (
                  <span className="font-mono text-xs text-muted-foreground">{s.customerPhone}</span>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Walk-in</span>
                )}
              </TableCell>
              <TableCell>{getPaymentBadge(s.paymentMethod)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {s.items.reduce((sum, it) => sum + it.quantity, 0)} pcs ({s.items.length} item{s.items.length !== 1 ? 's' : ''})
              </TableCell>
              <TableCell className="text-right font-bold text-foreground">
                ₹{Number(s.totalAmount).toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenReceipt(s)}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Receipt</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ReceiptDialog
        sale={selectedSale}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />
    </>
  );
}
