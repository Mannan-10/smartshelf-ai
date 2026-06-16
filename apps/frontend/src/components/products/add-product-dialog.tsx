"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Category } from "@/types/product";
import {
    defaultProductFormValues,
    productFormSchema,
    type ProductFormValues,
} from "@/lib/validation/product-schema";
import { productsApi } from "@/lib/products-api";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ProductForm } from "./product-form";

type AddProductDialogProps = {
    categories: Category[];
    onProductCreated: () => void | Promise<void>;
};

export function AddProductDialog({
    categories,
    onProductCreated,
}: AddProductDialogProps) {
    const [open, setOpen] = useState(false);
    const [serverError, setServerError] = useState("");

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: defaultProductFormValues,
    });

    const onSubmit = async (values: ProductFormValues) => {
        setServerError("");

        try {
            await productsApi.createProduct(values);
            await onProductCreated();

            form.reset(defaultProductFormValues);
            setOpen(false);
        } catch (error) {
            setServerError(
                error instanceof Error ? error.message : "Unable to create product"
            );
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                setOpen(value);
                setServerError("");

                if (!value) {
                    form.reset(defaultProductFormValues);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button>Add product</Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add product</DialogTitle>
                    <DialogDescription>
                        Create a new product with stock, category, pricing, and expiry
                        information.
                    </DialogDescription>
                </DialogHeader>

                {serverError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {serverError}
                    </div>
                )}

                <ProductForm
                    form={form}
                    categories={categories}
                    isSubmitting={form.formState.isSubmitting}
                    submitLabel="Create product"
                    onSubmit={onSubmit}
                    onCancel={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}