'use client';

import { useEffect, useState, useCallback } from 'react';
import { ForecastCard } from './ForecastCard';
import { AutoPOPanel } from './auto-po-panel';
import { DynamicMarkdownPanel } from './dynamic-markdown-panel';
import { productsApi } from '@/lib/products-api';
import type { Product } from '@/types/product';
import { LineChart, Truck, Sparkles } from 'lucide-react';

export function ForecastManager() {
  const [activeTab, setActiveTab] = useState<'forecast' | 'restock' | 'markdown'>('forecast');
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

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Operations & Intelligence</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Predictive demand forecasting, automated restock order drafting, and dynamic expiry clearance markdowns.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setActiveTab('forecast')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
            activeTab === 'forecast'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <LineChart className="h-4 w-4" />
          <span>Demand Forecasts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('restock')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
            activeTab === 'restock'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>AI Restock Assistant (Auto-PO)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('markdown')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
            activeTab === 'markdown'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>Expiry Clearance & Markdowns</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Tab 1: Demand Forecasts */}
      {activeTab === 'forecast' && (
        <div className="space-y-4">
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
      )}

      {/* Tab 2: Auto-PO Assistant */}
      {activeTab === 'restock' && <AutoPOPanel />}

      {/* Tab 3: Dynamic Expiry Clearance Markdowns */}
      {activeTab === 'markdown' && <DynamicMarkdownPanel />}
    </div>
  );
}