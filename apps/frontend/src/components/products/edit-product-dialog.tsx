"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Category, Product } from "@/types/product";
import {
    productFormSchema,
    type ProductFormValues,
} from "@/lib/validation/product-schema";
import { productsApi } from "@/lib/products-api";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ProductForm } from "./product-form";

type EditProductDialogProps = {
    product: Product | null;
    categories: Category[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProductUpdated: () => void | Promise<void>;
};

function getDateInputValue(date?: string | null) {
    if (!date) {
        return undefined;
    }

    return date.split("T")[0];
}

function getProductFormValues(product: Product): ProductFormValues {
    return {
        name: product.name,
        sku: product.sku,
        description: product.description ?? undefined,
        categoryId: product.categoryId ?? undefined,
        stock: product.stock,
        reorderLevel: product.reorderLevel,
        costPrice:
            product.costPrice === null || product.costPrice === undefined
                ? undefined
                : Number(product.costPrice),
        sellingPrice:
            product.sellingPrice === null || product.sellingPrice === undefined
                ? undefined
                : Number(product.sellingPrice),
        expiryDate: getDateInputValue(product.expiryDate),
    };
}

export function EditProductDialog({
    product,
    categories,
    open,
    onOpenChange,
    onProductUpdated,
}: EditProductDialogProps) {
    const [serverError, setServerError] = useState("");

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema) as any,
        defaultValues: product
            ? getProductFormValues(product)
            : {
                name: "",
                sku: "",
                description: undefined,
                categoryId: undefined,
                stock: 0,
                reorderLevel: 10,
                costPrice: undefined,
                sellingPrice: undefined,
                expiryDate: undefined,
            },
    });

    useEffect(() => {
        if (product && open) {
            form.reset(getProductFormValues(product));
            setServerError("");
        }
    }, [form, open, product]);

    const onSubmit = async (values: ProductFormValues) => {
        if (!product) {
            return;
        }

        setServerError("");

        try {
            const payload = {
                ...values,
                costPrice: values.costPrice !== undefined && values.costPrice !== null ? String(values.costPrice) : undefined,
                sellingPrice: values.sellingPrice !== undefined && values.sellingPrice !== null ? String(values.sellingPrice) : undefined,
            };
            await productsApi.updateProduct(product.id, payload);
            await onProductUpdated();

            onOpenChange(false);
        } catch (error) {
            setServerError(
                error instanceof Error ? error.message : "Unable to update product"
            );
        }
    };

    if (!product) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                onOpenChange(value);
                setServerError("");
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit product</DialogTitle>
                    <DialogDescription>
                        Update product details, stock, category, price, and expiry
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
                    submitLabel="Update product"
                    onSubmit={onSubmit}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}