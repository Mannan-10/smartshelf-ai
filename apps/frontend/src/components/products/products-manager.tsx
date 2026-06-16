"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Category, Product } from "@/types/product";
import { productsApi } from "@/lib/products-api";

import { AddProductDialog } from "./add-product-dialog";
import { EditProductDialog } from "./edit-product-dialog";
import { ProductTable } from "./product-table";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const loadProductsData = useCallback(async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        productsApi.getProducts(),
        productsApi.getCategories(),
      ]);

      setProducts(productsResponse);
      setCategories(categoriesResponse);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Unable to load products data"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProductsData();
  }, [loadProductsData]);

  const filteredProducts = useMemo(() => {
    if (categoryFilter === "all") {
      return products;
    }

    if (categoryFilter === "uncategorized") {
      return products.filter((product) => !product.categoryId);
    }

    return products.filter((product) => product.categoryId === categoryFilter);
  }, [categoryFilter, products]);

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(product.id);
    setPageError("");

    try {
      await productsApi.deleteProduct(product.id);
      await loadProductsData();
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Unable to delete product"
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
            <CardTitle>Products</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Total products: {products.length} • Showing:{" "}
              {filteredProducts.length}
            </p>
          </div>

          <AddProductDialog
            categories={categories}
            onProductCreated={loadProductsData}
          />
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium">Category filter</p>
              <p className="text-xs text-muted-foreground">
                Filter products by category.
              </p>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[260px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>

                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {pageError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pageError}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
          Loading products...
        </div>
      ) : (
        <ProductTable
          products={filteredProducts}
          deletingId={deletingId}
          onEdit={setEditingProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      <EditProductDialog
        product={editingProduct}
        categories={categories}
        open={Boolean(editingProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProduct(null);
          }
        }}
        onProductUpdated={loadProductsData}
      />
    </div>
  );
}