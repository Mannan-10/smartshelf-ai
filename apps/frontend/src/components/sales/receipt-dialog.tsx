'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateBarcode128 } from '@/lib/barcode';
import type { Sale } from '@/types/sale';
import { Printer, Receipt, CheckCircle2 } from 'lucide-react';

type Props = {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName?: string | null;
};

export function ReceiptDialog({
  sale,
  open,
  onOpenChange,
  storeName,
}: Props) {
  const displayStoreName = storeName || 'SmartShelf Store';
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');

  const invoiceBarcode = useMemo(() => {
    if (!sale?.invoiceNumber) return null;
    return generateBarcode128(sale.invoiceNumber, {
      height: 36,
      unitWidth: 1.5,
      quietZone: 6,
      showText: true,
      fontSize: 10,
    });
  }, [sale?.invoiceNumber]);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const saleDateFormatted = new Date(sale.saleDate || sale.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const widthStyle = paperWidth === '58mm' ? 'max-w-[280px]' : 'max-w-[340px]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <span>POS Sales Receipt</span>
            </div>
            <div className="flex items-center gap-1 text-xs border rounded p-1">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-0.5 rounded text-xs transition ${
                  paperWidth === '80mm' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                }`}
              >
                80mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-0.5 rounded text-xs transition ${
                  paperWidth === '58mm' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                }`}
              >
                58mm
              </button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Container Preview */}
        <div className="bg-muted/40 p-4 rounded-lg flex justify-center max-h-[460px] overflow-y-auto">
          <div
            id="thermal-receipt"
            className={`w-full ${widthStyle} bg-white text-black p-4 rounded shadow-sm border font-mono text-xs flex flex-col justify-between`}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
          >
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-gray-400">
              <div className="font-bold text-sm uppercase tracking-wide">{displayStoreName}</div>
              <div className="text-[10px] text-gray-500">Retail & Smart Inventory POS</div>
              <div className="text-[10px] text-gray-500 mt-1">Date: {saleDateFormatted}</div>
              <div className="text-[10px] font-bold text-gray-700">Inv: #{sale.invoiceNumber}</div>
            </div>

            {/* Customer Info (if present) */}
            {(sale.customerName || sale.customerPhone) && (
              <div className="py-1.5 border-b border-dashed border-gray-400 text-[11px]">
                {sale.customerName && <div>Customer: <span className="font-bold">{sale.customerName}</span></div>}
                {sale.customerPhone && <div>Phone: <span>{sale.customerPhone}</span></div>}
              </div>
            )}

            {/* Payment Method */}
            <div className="py-1 flex justify-between items-center text-[10px] text-gray-600 border-b border-dashed border-gray-400">
              <span>Payment Mode:</span>
              <span className="font-bold uppercase tracking-wider px-1.5 py-0.5 bg-gray-100 rounded text-gray-800">
                {sale.paymentMethod || 'CASH'}
              </span>
            </div>

            {/* Itemized Table */}
            <div className="py-2 border-b border-dashed border-gray-400">
              <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b text-gray-600">
                <span className="col-span-6">ITEM</span>
                <span className="col-span-3 text-right">QTY x RATE</span>
                <span className="col-span-3 text-right">AMT</span>
              </div>
              <div className="divide-y divide-gray-100 pt-1">
                {sale.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 py-1 items-center">
                    <span className="col-span-6 font-semibold truncate pr-1">
                      {item.product?.name || 'Product'}
                    </span>
                    <span className="col-span-3 text-right text-gray-600 text-[10px]">
                      {item.quantity} x {item.unitPrice.toFixed(0)}
                    </span>
                    <span className="col-span-3 text-right font-medium">
                      ₹{item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="pt-2 pb-2 space-y-1">
              <div className="flex justify-between items-center text-[11px] text-gray-600">
                <span>Total Items:</span>
                <span>{sale.items.reduce((sum, it) => sum + it.quantity, 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-dashed border-gray-400">
                <span>GRAND TOTAL:</span>
                <span className="text-base font-extrabold text-emerald-800">₹{sale.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Barcode Footer */}
            {invoiceBarcode && (
              <div className="pt-3 border-t border-dashed border-gray-400 text-center flex flex-col items-center">
                <div
                  className="w-full flex justify-center items-center my-1"
                  dangerouslySetInnerHTML={{ __html: invoiceBarcode.svg }}
                />
                <div className="text-[9px] text-gray-500 mt-1">
                  Thank you for your visit! Please retain receipt for returns.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Done
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Print Receipt
          </Button>
        </div>

        {/* Print Only CSS Layout */}
        <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-50 print:p-0">
          <div
            className={`w-full ${paperWidth === '58mm' ? 'max-w-[58mm]' : 'max-w-[80mm]'} p-2 text-black font-mono text-[10px] leading-tight`}
          >
            <div className="text-center font-bold text-xs uppercase mb-1">{displayStoreName}</div>
            <div className="text-center text-[9px] text-gray-500">Retail & Inventory POS</div>
            <div className="text-center text-[9px] mb-2">{saleDateFormatted} | Inv: #{sale.invoiceNumber}</div>
            {(sale.customerName || sale.customerPhone) && (
              <div className="border-t border-dashed border-gray-400 py-1">
                {sale.customerName && <div>Customer: {sale.customerName}</div>}
                {sale.customerPhone && <div>Phone: {sale.customerPhone}</div>}
              </div>
            )}
            <div className="border-t border-b border-dashed border-gray-400 py-1 my-1">
              <div className="flex justify-between font-bold">
                <span>ITEM</span>
                <span>TOTAL</span>
              </div>
              {sale.items.map((item) => (
                <div key={item.id} className="flex justify-between py-0.5">
                  <span className="truncate max-w-[130px]">{item.product?.name} x{item.quantity}</span>
                  <span>₹{item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-xs py-1">
              <span>TOTAL ({sale.paymentMethod || 'CASH'})</span>
              <span>₹{sale.totalAmount.toFixed(2)}</span>
            </div>
            {invoiceBarcode && (
              <div className="text-center pt-2 border-t border-dashed border-gray-400">
                <div dangerouslySetInnerHTML={{ __html: invoiceBarcode.svg }} />
                <div className="text-[8px] mt-1">Thank You!</div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
