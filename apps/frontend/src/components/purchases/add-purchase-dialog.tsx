'use client';

import type { Vendor } from '@/types/vendor';
import type { Product } from '@/types/product';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { purchaseSchema, type PurchaseFormValues } from '@/lib/validation/purchase-schema';
import { purchasesApi } from '@/lib/purchases-api';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PurchaseForm } from './purchase-form';

type AddPurchaseDialogProps = {
    vendors: Vendor[];
    products: Product[];
    onSuccess: () => void;
};

export function AddPurchaseDialog({ vendors, products, onSuccess }: AddPurchaseDialogProps) {
    const [open, setOpen] = useState(false);

    const form = useForm<PurchaseFormValues>({
        resolver: zodResolver(purchaseSchema) as any,
        defaultValues: {
            vendorId: '',
            notes: '',
            items: [{ productId: '', quantity: 1, unitPrice: 0 }],
        },
    });

    async function handleSubmit(values: PurchaseFormValues) {
        await purchasesApi.createPurchase(values);
        form.reset();
        setOpen(false);
        onSuccess();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New Purchase Order
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                            </svg>
                        </div>
                        New Purchase Order
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Record a new incoming stock purchase from a vendor.
                    </p>
                </DialogHeader>
                <div className="mt-2">
                    <PurchaseForm
                        form={form}
                        isSubmitting={form.formState.isSubmitting}
                        submitLabel="Create Purchase Order"
                        vendors={vendors}
                        products={products}
                        onSubmit={handleSubmit}
                        onCancel={() => setOpen(false)}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}