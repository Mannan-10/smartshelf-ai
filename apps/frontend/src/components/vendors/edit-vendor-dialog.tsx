'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import type { Vendor } from '@/types/vendor';
import {
    defaultVendorFormValues,
    vendorFormSchema,
    type VendorFormValues,
} from '@/lib/validation/vendor-schema';
import { vendorsApi } from '@/lib/vendors-api';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { VendorForm } from './vendor-form';

type EditVendorDialogProps = {
    vendor: Vendor | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVendorUpdated: () => void | Promise<void>;
};

function getVendorFormValues(vendor: Vendor): VendorFormValues {
    return {
        name: vendor.name,
        contactName: vendor.contactName ?? undefined,
        email: vendor.email ?? undefined,
        phone: vendor.phone ?? undefined,
        address: vendor.address ?? undefined,
        gstNumber: vendor.gstNumber ?? undefined,
        notes: vendor.notes ?? undefined,
    };
}

export function EditVendorDialog({
    vendor,
    open,
    onOpenChange,
    onVendorUpdated,
}: EditVendorDialogProps) {
    const [serverError, setServerError] = useState('');

    const form = useForm<VendorFormValues>({
        resolver: zodResolver(vendorFormSchema) as any,
        defaultValues: vendor ? getVendorFormValues(vendor) : defaultVendorFormValues,
    });

    useEffect(() => {
        if (vendor && open) {
            form.reset(getVendorFormValues(vendor));
            setServerError('');
        }
    }, [form, open, vendor]);

    const onSubmit = async (values: VendorFormValues) => {
        if (!vendor) {
            return;
        }

        setServerError('');

        try {
            await vendorsApi.updateVendor(vendor.id, values);
            await onVendorUpdated();

            onOpenChange(false);
        } catch (error) {
            setServerError(
                error instanceof Error ? error.message : 'Unable to update vendor',
            );
        }
    };

    if (!vendor) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                onOpenChange(value);
                setServerError('');
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit vendor</DialogTitle>
                    <DialogDescription>
                        Update vendor contact, GST, address, and note details.
                    </DialogDescription>
                </DialogHeader>

                {serverError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {serverError}
                    </div>
                )}

                <VendorForm
                    form={form}
                    isSubmitting={form.formState.isSubmitting}
                    submitLabel="Update vendor"
                    onSubmit={onSubmit}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}