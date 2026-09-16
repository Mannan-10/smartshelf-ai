'use client';

import { useState, useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { SaleFormValues } from '@/lib/validation/sale-schema';
import type { Product } from '@/types/product';

import { useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { CameraBarcodeScanner } from './camera-barcode-scanner';
import {
  Camera,
  Barcode,
  Banknote,
  QrCode,
  CreditCard,
  UserCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

type SaleFormProps = {
  form: UseFormReturn<SaleFormValues>;
  isSubmitting: boolean;
  submitLabel: string;
  products: Product[];
  onSubmit: (values: SaleFormValues) => void | Promise<void>;
  onCancel: () => void;
};

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: Banknote, desc: 'Paper currency' },
  { id: 'UPI', label: 'UPI / QR', icon: QrCode, desc: 'GPay, PhonePe, Paytm' },
  { id: 'CARD', label: 'Card', icon: CreditCard, desc: 'Debit / Credit POS' },
  { id: 'CREDIT', label: 'Store Credit', icon: UserCheck, desc: 'Pay later / Khata' },
] as const;

export function SaleForm({
  form,
  isSubmitting,
  submitLabel,
  products,
  onSubmit,
  onCancel,
}: SaleFormProps) {
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);
  const [scanNotice, setScanNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const selectedPaymentMethod = form.watch('paymentMethod') || 'CASH';

  // Handle barcode scanned from camera or hardware USB scanner
  const handleBarcodeDetected = useCallback(
    (scannedBarcode: string) => {
      const code = scannedBarcode.trim().toLowerCase();
      if (!code) return;

      const product = products.find(
        (p) => p.sku?.trim().toLowerCase() === code || p.id.toLowerCase() === code
      );

      if (!product) {
        setScanNotice({
          type: 'error',
          message: `Product with barcode "${scannedBarcode}" not found in inventory.`,
        });
        setTimeout(() => setScanNotice(null), 4000);
        return;
      }

      const currentItems = form.getValues('items') || [];
      const existingIdx = currentItems.findIndex((it) => it.productId === product.id);

      if (existingIdx !== -1) {
        // Increment quantity of existing item
        const existing = currentItems[existingIdx];
        const newQty = (Number(existing.quantity) || 1) + 1;
        update(existingIdx, {
          ...existing,
          quantity: newQty,
        });
        setScanNotice({
          type: 'success',
          message: `Updated quantity for "${product.name}" (${newQty}x)`,
        });
      } else {
        // If first row is empty, fill it
        if (
          currentItems.length === 1 &&
          !currentItems[0].productId
        ) {
          update(0, {
            productId: product.id,
            quantity: 1,
            unitPrice: Number(product.sellingPrice) || 0,
          });
        } else {
          append({
            productId: product.id,
            quantity: 1,
            unitPrice: Number(product.sellingPrice) || 0,
          });
        }
        setScanNotice({
          type: 'success',
          message: `Scanned and added "${product.name}" (₹${product.sellingPrice})`,
        });
      }

      setTimeout(() => setScanNotice(null), 3500);
    },
    [products, form, update, append]
  );

  // Activate hardware USB/Bluetooth barcode wedge scanner
  useBarcodeScanner({
    onScan: handleBarcodeDetected,
    enabled: true,
  });

  const handleManualBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcodeInput.trim()) {
      handleBarcodeDetected(manualBarcodeInput);
      setManualBarcodeInput('');
    }
  };

  const items = form.watch('items');
  const total = items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-2">
        {/* Rapid POS Barcode Scanning Banner */}
        <div className="bg-muted/40 border rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>Hardware & Camera Scanner Active</span>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Plug in USB scanner or scan with mobile camera
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <form onSubmit={handleManualBarcodeSubmit} className="flex gap-1.5 flex-1 sm:flex-initial">
              <div className="relative flex-1">
                <Barcode className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Scan or enter SKU..."
                  value={manualBarcodeInput}
                  onChange={(e) => setManualBarcodeInput(e.target.value)}
                  className="w-full sm:w-44 pl-8 pr-2 py-1.5 text-xs rounded-md border bg-background"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs">
                Scan
              </Button>
            </form>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCameraScannerOpen(true)}
              className="h-8 gap-1.5 text-xs shrink-0"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Camera</span>
            </Button>
          </div>
        </div>

        {/* Scan Status Toast notification banner */}
        {scanNotice && (
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 transition-all ${
              scanNotice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}
          >
            {scanNotice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span className="font-medium">{scanNotice.message}</span>
          </div>
        )}

        {/* Line Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Cart Items
            </h3>
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {fields.length} {fields.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="rounded-lg border bg-background overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_90px_120px_40px] gap-4 bg-muted/40 px-4 py-2.5 border-b text-xs font-bold tracking-wider text-muted-foreground uppercase">
              <div>Product & SKU</div>
              <div>Qty</div>
              <div>Price (₹)</div>
              <div></div>
            </div>

            {/* Table Body */}
            <div className="p-3 space-y-3">
              {fields.map((field, index) => {
                const selectedProductId = form.watch(`items.${index}.productId`);
                const selectedProduct = products.find((p) => p.id === selectedProductId);

                return (
                  <div key={field.id} className="grid grid-cols-[1fr_90px_120px_40px] gap-4 items-start">
                    {/* Product Selector */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field: selectField }) => (
                        <FormItem>
                          <Select
                            onValueChange={(val) => {
                              selectField.onChange(val);
                              const p = products.find((prod) => prod.id === val);
                              if (p) {
                                form.setValue(
                                  `items.${index}.unitPrice`,
                                  Number(p.sellingPrice) || 0
                                );
                              }
                            }}
                            value={selectField.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 bg-background text-xs sm:text-sm">
                                <SelectValue placeholder="Choose product or scan barcode..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.length === 0 ? (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                  No products found
                                </div>
                              ) : (
                                products.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    <div className="flex items-center justify-between w-full pr-2 gap-4">
                                      <div className="flex flex-col text-left">
                                        <span className="font-medium">{p.name}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                          SKU: {p.sku}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-xs font-semibold text-emerald-600">
                                          ₹{Number(p.sellingPrice).toFixed(2)}
                                        </span>
                                        <div className="text-[10px] text-muted-foreground tabular-nums">
                                          {p.stock} in stock
                                        </div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {selectedProduct && (
                            <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
                              <span>SKU: <strong className="font-mono">{selectedProduct.sku}</strong></span>
                              <span>Available: <strong>{selectedProduct.stock}</strong></span>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Qty */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field: qtyField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={selectedProduct?.stock}
                              placeholder="1"
                              className="h-10 bg-background text-center font-bold"
                              {...qtyField}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Unit Price */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field: priceField }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                                ₹
                              </span>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                placeholder="0.00"
                                className="h-10 pl-7 bg-background"
                                {...priceField}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Remove */}
                    <div className="flex items-center justify-end pt-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        className="h-10 w-10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 text-sm font-semibold text-primary hover:bg-transparent hover:underline px-0"
            onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
          >
            <Plus className="h-4 w-4" />
            Add Another Line Item
          </Button>
        </div>

        {/* Customer & Payment Mode Section */}
        <div className="grid md:grid-cols-2 gap-4 pt-2">
          {/* Customer Details */}
          <div className="border rounded-xl p-4 bg-background space-y-3">
            <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <span>Customer Details (Optional)</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ramesh Kumar" className="h-9 text-xs" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Phone / WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 9876543210" className="h-9 text-xs font-mono" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Order Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Discount details, delivery notes..." className="h-9 text-xs" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Payment Method Selector */}
          <div className="border rounded-xl p-4 bg-background space-y-3 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-2.5">
                Payment Method
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = selectedPaymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => form.setValue('paymentMethod', pm.id as 'CASH' | 'UPI' | 'CARD' | 'CREDIT')}
                      className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm ring-1 ring-primary'
                          : 'border-border hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="leading-tight">
                        <div className="text-xs">{pm.label}</div>
                        <div className="text-[10px] text-muted-foreground font-normal">{pm.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total summary */}
            <div className="pt-3 border-t flex items-baseline justify-between">
              <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Grand Total
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">₹</span>
                <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {total.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-6 gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                <span>Processing Sale...</span>
              </>
            ) : (
              <>
                <span>{submitLabel}</span>
                <span className="text-xs opacity-75 font-mono ml-1">
                  (₹{total.toFixed(0)})
                </span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScanner
        open={cameraScannerOpen}
        onOpenChange={setCameraScannerOpen}
        onDetected={handleBarcodeDetected}
      />
    </Form>
  );
}