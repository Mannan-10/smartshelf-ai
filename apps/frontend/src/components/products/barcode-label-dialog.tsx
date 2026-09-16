'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateBarcode128 } from '@/lib/barcode';
import { Barcode, Printer, Download } from 'lucide-react';

type Props = {
  productName: string;
  sku: string;
  sellingPrice: number;
  categoryName?: string;
  trigger?: React.ReactNode;
};

export function BarcodeLabelDialog({
  productName,
  sku,
  sellingPrice,
  categoryName,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [copies, setCopies] = useState(1);
  const [format, setFormat] = useState<'single' | 'sheet'>('single');

  const barcodeData = useMemo(() => {
    return generateBarcode128(sku, {
      height: 45,
      unitWidth: 1.8,
      quietZone: 8,
      showText: true,
      fontSize: 11,
    });
  }, [sku]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([barcodeData.svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sku}-barcode.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const labelCount = format === 'single' ? 1 : Math.max(1, copies);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Barcode className="h-3.5 w-3.5" />
            <span>Label</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Barcode className="h-5 w-5 text-primary" />
            Barcode & Shelf Label Generator
          </DialogTitle>
        </DialogHeader>

        {/* Options */}
        <div className="flex flex-wrap items-center gap-4 py-2 border-b text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Format:</span>
            <select
              className="border rounded px-2 py-1 bg-background text-sm"
              value={format}
              onChange={(e) => setFormat(e.target.value as 'single' | 'sheet')}
            >
              <option value="single">Single Label (Shelf Tag)</option>
              <option value="sheet">Batch Sheet (A4 / Multi)</option>
            </select>
          </div>

          {format === 'sheet' && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Copies:</span>
              <input
                type="number"
                min="1"
                max="48"
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 border rounded px-2 py-1 text-sm bg-background"
              />
            </div>
          )}
        </div>

        {/* Preview Area */}
        <div className="bg-muted/40 p-4 rounded-lg flex flex-col items-center justify-center min-h-[220px] max-h-[360px] overflow-auto">
          <div className="flex flex-wrap gap-4 justify-center">
            {Array.from({ length: Math.min(labelCount, 12) }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white text-black p-3 rounded border shadow-sm w-64 flex flex-col items-center justify-between text-center select-none"
                style={{ minHeight: '120px' }}
              >
                <div className="w-full text-left flex justify-between items-start border-b pb-1 mb-1.5">
                  <div className="truncate pr-2">
                    <div className="font-bold text-xs truncate uppercase tracking-tight">{productName}</div>
                    {categoryName && (
                      <div className="text-[10px] text-gray-500 truncate">{categoryName}</div>
                    )}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="font-extrabold text-sm text-emerald-700">₹{sellingPrice.toFixed(2)}</div>
                  </div>
                </div>

                {/* Barcode SVG Rendering */}
                <div
                  className="w-full flex justify-center items-center my-1"
                  dangerouslySetInnerHTML={{ __html: barcodeData.svg }}
                />

                <div className="w-full text-[9px] text-gray-400 font-mono tracking-widest pt-1 border-t mt-1">
                  SMARTSHELF POS • SKU: {sku}
                </div>
              </div>
            ))}
          </div>
          {labelCount > 12 && (
            <p className="text-xs text-muted-foreground mt-3">
              + {labelCount - 12} more labels will print on the sheet
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSvg}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Download SVG
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Labels
            </Button>
          </div>
        </div>

        {/* Printable container hidden on screen, visible only when printing */}
        <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-50 print:p-4">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: labelCount }).map((_, idx) => (
              <div
                key={idx}
                className="border border-dashed border-gray-400 p-3 flex flex-col items-center justify-between text-center"
                style={{ width: '240px', height: '140px', pageBreakInside: 'avoid' }}
              >
                <div className="w-full flex justify-between items-center border-b pb-1">
                  <span className="font-bold text-xs uppercase truncate max-w-[140px]">{productName}</span>
                  <span className="font-bold text-xs">₹{sellingPrice.toFixed(2)}</span>
                </div>
                <div
                  className="my-1"
                  dangerouslySetInnerHTML={{ __html: barcodeData.svg }}
                />
                <div className="text-[8px] text-gray-500 font-mono">
                  {sku}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
