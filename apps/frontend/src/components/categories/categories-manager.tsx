"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category } from "@/types/product";
import { productsApi } from "@/lib/products-api";

import { AddCategoryDialog } from "./add-category-dialog";
import { EditCategoryDialog } from "./edit-category-dialog";
import { CategoryTable } from "./category-table";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export function CategoriesManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    const loadCategories = useCallback(async () => {
        setIsLoading(true);
        setPageError("");

        try {
            const categoriesResponse = await productsApi.getCategories();
            setCategories(categoriesResponse);
        } catch (error) {
            setPageError(
                error instanceof Error
                    ? error.message
                    : "Unable to load categories data"
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCategories();
    }, [loadCategories]);

    const handleDeleteCategory = async (category: Category) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${category.name}"? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        setDeletingId(category.id);
        setPageError("");

        try {
            await productsApi.deleteCategory(category.id);
            await loadCategories();
        } catch (error) {
            setPageError(
                error instanceof Error ? error.message : "Unable to delete category"
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Categories</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage product categories. Total categories: {categories.length}
                        </p>
                    </div>

                    <AddCategoryDialog
                        onCategoryCreated={loadCategories}
                    />
                </CardHeader>
            </Card>

            {pageError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {pageError}
                </div>
            )}

            {isLoading ? (
                <div className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
                    Loading categories...
                </div>
            ) : (
                <CategoryTable
                    categories={categories}
                    deletingId={deletingId}
                    onEdit={setEditingCategory}
                    onDelete={handleDeleteCategory}
                />
            )}

            <EditCategoryDialog
                category={editingCategory}
                open={Boolean(editingCategory)}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingCategory(null);
                    }
                }}
                onCategoryUpdated={loadCategories}
            />
        </div>
    );
}
