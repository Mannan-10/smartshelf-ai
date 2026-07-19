"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Category } from "@/types/product";
import {
    categoryFormSchema,
    type CategoryFormValues,
} from "@/lib/validation/category-schema";
import { productsApi } from "@/lib/products-api";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CategoryForm } from "./category-form";

type EditCategoryDialogProps = {
    category: Category | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCategoryUpdated: () => void | Promise<void>;
};

export function EditCategoryDialog({
    category,
    open,
    onOpenChange,
    onCategoryUpdated,
}: EditCategoryDialogProps) {
    const [serverError, setServerError] = useState("");

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    useEffect(() => {
        if (category && open) {
            form.reset({
                name: category.name,
                description: category.description || "",
            });
            setServerError("");
        }
    }, [category, open, form]);

    const onSubmit = async (values: CategoryFormValues) => {
        if (!category) return;
        
        setServerError("");

        try {
            await productsApi.updateCategory(category.id, values);
            await onCategoryUpdated();
            onOpenChange(false);
        } catch (error) {
            setServerError(
                error instanceof Error ? error.message : "Unable to update category"
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit category</DialogTitle>
                    <DialogDescription>
                        Update category details.
                    </DialogDescription>
                </DialogHeader>

                {serverError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {serverError}
                    </div>
                )}

                <CategoryForm
                    form={form}
                    isSubmitting={form.formState.isSubmitting}
                    submitLabel="Save changes"
                    onSubmit={onSubmit}
                    onCancel={() => onOpenChange(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
