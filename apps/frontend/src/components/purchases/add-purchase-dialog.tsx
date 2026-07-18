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
            items: [{ productId: '', quantity: 1, unitCost: 0 }],
        },
    });

    async function handleSubmit(values: PurchaseFormValues) {
        const payload: any = {
            ...values,
            items: values.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitCost: item.unitCost,
            }))
        };
        if (!payload.vendorId) {
            delete payload.vendorId;
        }
        await purchasesApi.createPurchase(payload as any);
        form.reset();
        setOpen(false);
        onSuccess();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm px-6">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New Purchase Order
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0 rounded-xl bg-background">
                {/* Clean Header */}
                <div className="border-b px-6 py-6 sm:px-8 bg-background">
                    <DialogHeader>
                        <DialogTitle className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                                <svg className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m-2-2h4" />
                                </svg>
                            </div>
                            <div className="flex flex-col gap-1 mt-0.5">
                                <span className="text-xl font-bold tracking-tight text-foreground">New Purchase Order</span>
                                <span className="text-sm font-normal text-muted-foreground">
                                    Record a new incoming stock purchase from a vendor.
                                </span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-100px)] px-6 py-6 sm:px-8 custom-scrollbar">
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