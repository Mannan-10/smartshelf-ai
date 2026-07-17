'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { productsApi } from '@/lib/products-api';

const adjustSchema = z.object({
  quantityChange: z.coerce.number().refine(val => val !== 0, "Change cannot be 0"),
  note: z.string().max(255, "Note too long").optional(),
});

type AdjustFormValues = z.infer<typeof adjustSchema>;

export function AdjustStockDialog({
  productId,
  productName,
  currentStock,
  onSuccess,
}: {
  productId: string;
  productName: string;
  currentStock: number;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema) as any,
    defaultValues: { quantityChange: 0, note: '' },
  });

  async function onSubmit(values: AdjustFormValues) {
    if (currentStock + values.quantityChange < 0) {
      form.setError('quantityChange', { message: 'Cannot result in negative stock' });
      return;
    }
    
    try {
      await productsApi.adjustStock(productId, values);
      setOpen(false);
      form.reset();
      onSuccess();
    } catch (error) {
      form.setError('root', { message: error instanceof Error ? error.message : 'Failed to adjust stock' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Adjust</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock: {productName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="rounded border bg-muted/50 p-3 text-sm">
              Current Stock: <strong>{currentStock}</strong>
            </div>

            <FormField
              control={form.control}
              name="quantityChange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Change (+/-)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason / Note</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Damage, shrinkage, initial count..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Save Adjustment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
