"use client";

import type { Product } from "@/types/product";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProductTableProps = {
  products: Product[];
  deletingId: string | null;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

function formatCurrency(value: Product["sellingPrice"]) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numberValue = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(numberValue)) {
    return "-";
  }

  return `₹${numberValue.toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProductTable({
  products,
  deletingId,
  onEdit,
  onDelete,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border bg-background p-8 text-center">
        <h3 className="text-lg font-semibold">No products found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your first product or change the selected category filter.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-background">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Reorder</TableHead>
            <TableHead>Selling price</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead className="w-[150px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {products.map((product) => {
            const isLowStock = product.stock <= product.reorderLevel;

            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    {product.description && (
                      <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                        {product.description}
                      </p>
                    )}
                  </div>
                </TableCell>

                <TableCell>{product.sku}</TableCell>

                <TableCell>{product.category?.name || "-"}</TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{product.stock}</span>
                    {isLowStock && (
                      <Badge variant="destructive">Low</Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>{product.reorderLevel}</TableCell>

                <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>

                <TableCell>{formatDate(product.expiryDate)}</TableCell>

                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(product)}
                    >
                      Edit
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === product.id}
                      onClick={() => onDelete(product)}
                    >
                      {deletingId === product.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}