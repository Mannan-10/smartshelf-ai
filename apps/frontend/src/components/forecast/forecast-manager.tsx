'use client';

import { useEffect, useState, useCallback } from 'react';
import { ForecastCard } from './ForecastCard';
import { productsApi } from '@/lib/products-api';
import type { Product } from '@/types/product';

export function ForecastManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await productsApi.getProducts();
      setProducts(data || []);
    } catch {
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Demand Forecast</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          7-day demand predictions powered by XGBoost
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border bg-muted" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No products found. Add products first to see forecasts.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <ForecastCard
              key={p.id}
              productId={p.id}
              productName={p.name}
              currentStock={p.stock}
            />
          ))}
        </div>
      )}
    </div>
  );
}