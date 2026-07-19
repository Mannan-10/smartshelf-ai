"use client";

import type { UseFormReturn } from "react-hook-form";
import type { CategoryFormValues } from "@/lib/validation/category-schema";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CategoryFormProps = {
    form: UseFormReturn<CategoryFormValues>;
    isSubmitting: boolean;
    submitLabel: string;
    onSubmit: (values: CategoryFormValues) => void | Promise<void>;
    onCancel: () => void;
};

export function CategoryForm({
    form,
    isSubmitting,
    submitLabel,
    onSubmit,
    onCancel,
}: CategoryFormProps) {
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Electronics, Medical, Furniture..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Short description of this category"
                                    {...field}
                                    value={field.value ?? ""}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>

                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : submitLabel}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
