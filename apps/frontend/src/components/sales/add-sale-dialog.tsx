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
            setApiError(err instanceof Error ? err.message : 'Failed to create sale');
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); setApiError(null); }}>
            <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm px-6">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New Sale
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0 rounded-xl bg-background border-none shadow-2xl">
                {/* Clean Header */}
                <div className="border-b px-6 py-6 sm:px-8 bg-background">
                    <DialogHeader>
                        <DialogTitle className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                                <svg className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                                </svg>
                            </div>
                            <div className="flex flex-col gap-1 mt-0.5">
                                <span className="text-xl font-bold tracking-tight text-foreground">New Sale / Billing</span>
                                <span className="text-sm font-normal text-muted-foreground">
                                    Record a new outgoing stock sale and generate a bill.
                                </span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-100px)] px-6 py-6 sm:px-8 custom-scrollbar relative">
                    {apiError && (
                        <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{apiError}</span>
                        </div>
                    )}
                    
                    <SaleForm
                        form={form}
                        isSubmitting={form.formState.isSubmitting}
                        submitLabel="Create Sale"
                        products={products}
                        onSubmit={handleSubmit}
                        onCancel={() => setOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}