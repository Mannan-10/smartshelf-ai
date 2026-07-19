"use client";

import { Edit, Trash2 } from "lucide-react";
import type { Category } from "@/types/product";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type CategoryTableProps = {
    categories: Category[];
    deletingId: string | null;
    onEdit: (category: Category) => void;
    onDelete: (category: Category) => void;
};

export function CategoryTable({
    categories,
    deletingId,
    onEdit,
    onDelete,
}: CategoryTableProps) {
    if (categories.length === 0) {
        return (
            <div className="rounded-xl border border-dashed p-8 text-center">
                <h3 className="mb-1 font-medium">No categories found</h3>
                <p className="text-sm text-muted-foreground">
                    You haven't added any categories yet. Create one to organize your products.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border bg-background">
            <Table className="min-w-[600px]">
                <TableHeader>
                    <TableRow>
                        <TableHead>Category Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Products Count</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => (
                        <TableRow key={category.id}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {category.description || "-"}
                            </TableCell>
                            <TableCell>
                                {category._count?.Product || 0}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(category)}
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    >
                                        <Edit className="h-4 w-4" />
                                        <span className="sr-only">Edit</span>
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(category)}
                                        disabled={deletingId === category.id}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
