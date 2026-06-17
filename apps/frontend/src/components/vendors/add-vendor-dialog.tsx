'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
    defaultVendorFormValues,
    vendorFormSchema,
    type VendorFormValues,
} from '@/lib/validation/vendor-schema';
import { vendorsApi } from '@/lib/vendors-api';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { VendorForm } from './vendor-form';

type AddVendorDialogProps = {
    onVendorCreated: () => void | Promise<void>;
};

export function AddVendorDialog({ onVendorCreated }: AddVendorDialogProps) {
    const [open, setOpen] = useState(false);
    const [serverError, setServerError] = useState('');

    const form = useForm<VendorFormValues>({
        resolver: zodResolver(vendorFormSchema) as any,
        defaultValues: defaultVendorFormValues,
    });

    const onSubmit = async (values: VendorFormValues) => {
        setServerError('');

        try {
            await vendorsApi.createVendor(values);
            await onVendorCreated();

            form.reset(defaultVendorFormValues);
            setOpen(false);
        } catch (error) {
            setServerError(
                error instanceof Error ? error.message : 'Unable to create vendor',
            );
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                setOpen(value);
                setServerError('');

                if (!value) {
                    form.reset(defaultVendorFormValues);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button>Add vendor</Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add vendor</DialogTitle>
                    <DialogDescription>
                        Add supplier details like contact person, phone, email, GST number,
                        and address.
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
                    submitLabel="Create vendor"
                    onSubmit={onSubmit}
                    onCancel={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}