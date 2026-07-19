"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
    categoryFormSchema,
    defaultCategoryFormValues,
    type CategoryFormValues,
} from "@/lib/validation/category-schema";
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
import { CategoryForm } from "./category-form";

type AddCategoryDialogProps = {
    onCategoryCreated: () => void | Promise<void>;
};

export function AddCategoryDialog({
    onCategoryCreated,
}: AddCategoryDialogProps) {
    const [open, setOpen] = useState(false);
    const [serverError, setServerError] = useState("");

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues: defaultCategoryFormValues,
    });

    const onSubmit = async (values: CategoryFormValues) => {
        setServerError("");

        try {
            await productsApi.createCategory(values);
            await onCategoryCreated();

            form.reset(defaultCategoryFormValues);
            setOpen(false);
        } catch (error) {
            setServerError(
                error instanceof Error ? error.message : "Unable to create category"
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
                    form.reset(defaultCategoryFormValues);
                }
            }}
        >
            <DialogTrigger asChild>
                <Button>Add category</Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add category</DialogTitle>
                    <DialogDescription>
                        Create a new category to organize your products.
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
                    submitLabel="Create category"
                    onSubmit={onSubmit}
                    onCancel={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}
