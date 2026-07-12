'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ForecastResult = {
  product: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    reorderLevel: number;
  };
  forecast: {
    avgDailyQuantity: number;
    forecast7Days: number[];
    forecastTotal7Days: number;
    daysUntilStockout: number | null;
    reorderRecommended: boolean;
  };
  fallback?: boolean;
  fallbackReason?: string;
};

type Props = {
  productId: string;
  productName: string;
  currentStock: number;
};

export function ForecastCard({ productId, productName, currentStock }: Props) {
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleForecast() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/forecast/product/${productId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? 'Forecast failed');
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forecast failed');
    } finally {
      setIsLoading(false);
    }
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="rounded-xl border bg-background shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
        <div>
          <h3 className="font-semibold">{productName}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Current stock: <span className="font-medium">{currentStock}</span>
          </p>
        </div>
        <Button
          size="sm"
          variant={result ? 'outline' : 'default'}
          onClick={handleForecast}
          disabled={isLoading}
        >
          {isLoading ? 'Forecasting...' : result ? 'Refresh' : 'Forecast demand'}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-3 text-sm text-destructive border-b">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="px-5 py-4 space-y-4">

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Avg daily demand</p>
              <p className="mt-1 text-lg font-bold">
                {result.forecast.avgDailyQuantity}
                <span className="text-xs font-normal text-muted-foreground ml-1">units</span>
              </p>
            </div>

            <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">7-day total</p>
              <p className="mt-1 text-lg font-bold">
                {result.forecast.forecastTotal7Days}
                <span className="text-xs font-normal text-muted-foreground ml-1">units</span>
              </p>
            </div>

            <div className="rounded-lg bg-muted/40 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Days until stockout</p>
              <p className={`mt-1 text-lg font-bold ${result.forecast.daysUntilStockout !== null && result.forecast.daysUntilStockout <= 7
                  ? 'text-destructive'
                  : ''
                }`}>
                {result.forecast.daysUntilStockout !== null
                  ? `${result.forecast.daysUntilStockout}d`
                  : '—'}
              </p>
            </div>
          </div>

          {/* Reorder badge */}
          {result.forecast.reorderRecommended && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
              <span><strong>Reorder recommended</strong> — stock is at or below reorder level</span>
            </div>
          )}

          {result.fallback && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
              <span>
                {result.fallbackReason ?? 'Using rule-based fallback forecast'}
              </span>
            </div>
          )}

          {/* 7-day bar chart (pure CSS — no recharts dependency needed) */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">7-day forecast</p>
            <div className="flex items-end gap-1 h-16">
              {result.forecast.forecast7Days.map((qty, i) => {
                const max = Math.max(...result.forecast.forecast7Days, 1);
                const heightPct = Math.max(4, (qty / max) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{qty}</span>
                    <div
                      className="w-full rounded-t bg-primary/70"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-xs text-muted-foreground">{days[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Empty state */}
      {!result && !isLoading && !error && (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          Click "Forecast demand" to get a 7-day prediction powered by XGBoost.
        </div>
      )}
    </div>
  );
}