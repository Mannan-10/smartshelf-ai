'use client';

import type { Product } from '@/types/product';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { saleSchema, type SaleFormValues } from '@/lib/validation/sale-schema';
import { salesApi } from '@/lib/sales-api';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SaleForm } from './sale-form';

type AddSaleDialogProps = {
    products: Product[];
    onSuccess: () => void;
};

export function AddSaleDialog({ products, onSuccess }: AddSaleDialogProps) {
    const [open, setOpen] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const form = useForm<SaleFormValues>({
        resolver: zodResolver(saleSchema as any),
        defaultValues: {
            notes: '',
            items: [{ productId: '', quantity: 1, unitPrice: 0 }],
        },
    });

    async function handleSubmit(values: SaleFormValues) {
        setApiError(null);
        try {
            await salesApi.createSale(values);
            form.reset();
            setOpen(false);
            onSuccess();
        } catch (err) {
            // Show the backend error inline (e.g. insufficient stock message)
            setApiError(err instanceof Error ? err.message : 'Failed to create sale');
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); setApiError(null); }}>
            <DialogTrigger asChild>
                <Button>New sale</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New sale / billing</DialogTitle>
                </DialogHeader>

                {apiError && (
                    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                        <span>{apiError}</span>
                    </div>
                )}

                <SaleForm
                    form={form}
                    isSubmitting={form.formState.isSubmitting}
                    submitLabel="Create sale"
                    products={products}
                    onSubmit={handleSubmit}
                    onCancel={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}