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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Line items */}
                <div className="space-y-3">
                    <FormLabel>Items</FormLabel>

                    {fields.map((field, index) => {
                        // Show available stock for selected product
                        const selectedProductId = form.watch(`items.${index}.productId`);
                        const selectedProduct = products.find(p => p.id === selectedProductId);

                        return (
                            <div key={field.id} className="grid gap-3 grid-cols-[1fr_80px_110px_36px] items-start border rounded-lg p-3">

                                {/* Product */}
                                <FormField
                                    control={form.control}
                                    name={`items.${index}.productId`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs text-muted-foreground">
                                                Product
                                                {selectedProduct && (
                                                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                                                        (stock: {selectedProduct.stock})
                                                    </span>
                                                )}
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select product" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {products.map((p) => (
                                                        <SelectItem key={p.id} value={p.id}>
                                                            {p.name}
                                                            <span className="ml-2 text-xs text-muted-foreground">
                                                                ({p.stock} in stock)
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Quantity */}
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
                                                    max={selectedProduct?.stock}
                                                    placeholder="1"
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
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Remove row */}
                                <div className="pt-6">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => remove(index)}
                                        disabled={fields.length === 1}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        ✕
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
                    >
                        + Add item
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
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Customer name, payment terms, etc."
                                    {...field}
                                    value={field.value ?? ''}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Total */}
                <div className="flex justify-end text-sm font-medium">
                    Total: ₹{total.toFixed(2)}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}