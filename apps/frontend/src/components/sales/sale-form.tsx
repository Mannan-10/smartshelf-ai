'use client';

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

type SaleFormProps = {
    form: UseFormReturn<SaleFormValues>;
    isSubmitting: boolean;
    submitLabel: string;
    products: Product[];
    onSubmit: (values: SaleFormValues) => void | Promise<void>;
    onCancel: () => void;
};

export function SaleForm({
    form,
    isSubmitting,
    submitLabel,
    products,
    onSubmit,
    onCancel,
}: SaleFormProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    const items = form.watch('items');
    const total = items.reduce((sum, item) => {
        return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    }, 0);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-2">
                
                {/* Line Items Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Order Items</h3>
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {fields.length} {fields.length === 1 ? 'item' : 'items'}
                        </span>
                    </div>

                    <div className="rounded-lg border bg-background overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-[1fr_90px_120px_40px] gap-4 bg-muted/40 px-4 py-3 border-b">
                            <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Product</div>
                            <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Qty</div>
                            <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Price (₹)</div>
                            <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase"></div>
                        </div>

                        {/* Table Body */}
                        <div className="p-4 space-y-3">
                            {fields.map((field, index) => {
                                const selectedProductId = form.watch(`items.${index}.productId`);
                                const selectedProduct = products.find(p => p.id === selectedProductId);

                                return (
                                    <div key={field.id} className="grid grid-cols-[1fr_90px_120px_40px] gap-4 items-start">
                                        {/* Product */}
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.productId`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10 bg-background">
                                                                <SelectValue placeholder="Select..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {products.length === 0 ? (
                                                                <div className="py-4 text-center text-sm text-muted-foreground">No products found</div>
                                                            ) : products.map((p) => (
                                                                <SelectItem key={p.id} value={p.id}>
                                                                    <div className="flex items-center justify-between w-full pr-2 gap-4">
                                                                        <span>{p.name}</span>
                                                                        <span className="text-xs text-muted-foreground tabular-nums">
                                                                            ({p.stock} left)
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {selectedProduct && (
                                                        <div className="mt-1.5 flex items-center justify-end pr-1 text-[10px] text-muted-foreground">
                                                            Stock: <span className="font-semibold ml-1 text-foreground">{selectedProduct.stock}</span>
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
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={selectedProduct?.stock}
                                                            placeholder="1"
                                                            className="h-10 bg-background"
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
                                                    <FormControl>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                step={0.01}
                                                                placeholder="0.00"
                                                                className="h-10 pl-7 bg-background"
                                                                {...field}
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
                                                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                                            >
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
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
                        className="gap-2 text-sm font-semibold text-foreground hover:bg-transparent hover:underline px-0"
                        onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Another Item
                    </Button>

                    {form.formState.errors.items?.root && (
                        <p className="text-sm font-medium text-destructive mt-2">
                            {form.formState.errors.items.root.message}
                        </p>
                    )}
                </div>

                {/* Notes & Summary Container */}
                <div className="grid sm:grid-cols-2 gap-6 pt-2">
                    {/* Notes */}
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-semibold text-foreground">Additional Notes</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Customer details, payment mode..."
                                        className="h-24 pb-14 rounded-md bg-background"
                                        {...field}
                                        value={field.value ?? ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Total summary */}
                    <div className="flex flex-col justify-center rounded-lg bg-muted/20 border p-6">
                        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-2">Total Order Value</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-foreground">₹</span>
                            <span className="text-4xl font-bold tracking-tight text-foreground">
                                {total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 mt-8 border-t">
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
                                <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
                                </svg>
                                Creating Sale...
                            </>
                        ) : (
                            <>
                                {submitLabel}
                                <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                </svg>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}