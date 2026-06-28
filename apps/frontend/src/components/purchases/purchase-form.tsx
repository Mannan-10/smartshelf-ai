'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { PurchaseFormValues } from '@/lib/validation/purchase-schema';
import type { Vendor } from '@/types/vendor';
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

type PurchaseFormProps = {
    form: UseFormReturn<PurchaseFormValues>;
    isSubmitting: boolean;
    submitLabel: string;
    vendors: Vendor[];
    products: Product[];
    onSubmit: (values: PurchaseFormValues) => void | Promise<void>;
    onCancel: () => void;
};

export function PurchaseForm({
    form,
    isSubmitting,
    submitLabel,
    vendors,
    products,
    onSubmit,
    onCancel,
}: PurchaseFormProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    const items = form.watch('items');
    const total = items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return sum + qty * price;
    }, 0);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Vendor */}
                <FormField
                    control={form.control}
                    name="vendorId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-semibold">Vendor</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select a vendor…" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {vendors.length === 0 ? (
                                        <div className="py-4 text-center text-sm text-muted-foreground">No vendors found</div>
                                    ) : vendors.map((v) => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Line items */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-semibold">Line Items</FormLabel>
                        <span className="text-xs text-muted-foreground">{fields.length} item{fields.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="space-y-2">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="grid gap-3 grid-cols-[1fr_80px_110px_36px] items-start rounded-xl border bg-muted/30 p-3"
                            >
                                {/* Product */}
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.productId`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Product</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-9 text-sm">
                                                        <SelectValue placeholder="Select product…" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {products.length === 0 ? (
                                                        <div className="py-4 text-center text-sm text-muted-foreground">No products found</div>
                                                    ) : products.map((p) => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Qty */}
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.quantity`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Qty</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    placeholder="1"
                                                    className="h-9 text-sm"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Unit price */}
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.unitPrice`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">Unit price (₹)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step={0.01}
                                                    placeholder="0.00"
                                                    className="h-9 text-sm"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Remove */}
                                <div className="pt-6">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 text-sm"
                        onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Item
                    </Button>

                    {form.formState.errors.items?.root && (
                        <p className="text-sm text-destructive">
                            {form.formState.errors.items.root.message}
                        </p>
                    )}
                </div>

                {/* Notes */}
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-semibold">Notes</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Payment terms, delivery notes, etc."
                                    className="h-10"
                                    {...field}
                                    value={field.value ?? ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Total summary */}
                <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
                    <span className="text-sm font-medium text-muted-foreground">Order Total</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-1">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="gap-2">
                        {isSubmitting ? (
                            <>
                                <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
                                </svg>
                                Saving…
                            </>
                        ) : submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}