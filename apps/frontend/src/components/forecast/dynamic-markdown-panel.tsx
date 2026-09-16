'use client';

import { useState, useEffect, useCallback } from 'react';
import { automationApi } from '@/lib/automation-api';
import type { MarkdownRecommendationsResponse, MarkdownRecommendation } from '@/types/automation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tag,
  AlertTriangle,
  TrendingDown,
  Sparkles,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export function DynamicMarkdownPanel() {
  const [data, setData] = useState<MarkdownRecommendationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingProductId, setApplyingProductId] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await automationApi.getMarkdownRecommendations();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load markdown suggestions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  const handleApplyMarkdown = async (rec: MarkdownRecommendation) => {
    if (
      !confirm(
        `Apply ${rec.discountPercentage}% clearance discount for "${rec.productName}"?\n\nSelling price will update from ₹${rec.originalPrice} to ₹${rec.discountedPrice}.`
      )
    ) {
      return;
    }

    setApplyingProductId(rec.productId);
    setSuccessNote(null);
    try {
      await automationApi.applyMarkdown({
        productId: rec.productId,
        discountedPrice: rec.discountedPrice,
        reason: `Clearance: ${rec.daysToExpiry}d to expiry (${rec.discountPercentage}% OFF)`,
      });

      setSuccessNote(
        `Successfully applied ${rec.discountPercentage}% clearance price (₹${rec.discountedPrice}) to "${rec.productName}"!`
      );
      await loadRecommendations();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to apply clearance price');
    } finally {
      setApplyingProductId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
        Analyzing batch expiration schedules, historical sales velocity, and loss prevention projections...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive text-xs rounded-xl flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const recs = data?.recommendations || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>AI Dynamic Markdown & Expiry Clearance Engine</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Detects perishable batches with upcoming expiration dates and recommends dynamic promotional discounts
            to accelerate sell-through velocity and recover revenue before loss.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase font-bold">Revenue at Risk</div>
            <div className="text-2xl font-black text-destructive">
              ₹{data?.totalRevenueAtRisk.toLocaleString('en-IN') || 0}
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase font-bold">Revenue Recoverable</div>
            <div className="text-2xl font-black text-emerald-600">
              ₹{data?.potentialRevenueSaved.toLocaleString('en-IN') || 0}
            </div>
          </div>
        </div>
      </div>

      {successNote && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{successNote}</span>
        </div>
      )}

      {recs.length === 0 ? (
        <div className="py-16 text-center border rounded-2xl bg-background">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground">Zero Expiring Batches at Risk!</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            All inventory batches are well within their safe consumption horizons. No clearance discounts are currently necessary.
          </p>
        </div>
      ) : (
        <div className="border rounded-2xl bg-background overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] border-b">
                <tr>
                  <th className="px-5 py-3">Product / SKU</th>
                  <th className="px-4 py-3">Batch Quantity</th>
                  <th className="px-4 py-3">Expiry Window</th>
                  <th className="px-4 py-3 text-center">Sales Velocity</th>
                  <th className="px-4 py-3 text-center">Pricing & Discount</th>
                  <th className="px-4 py-3 text-right">Revenue Saved</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recs.map((rec) => (
                  <tr key={rec.batchId} className="hover:bg-muted/10 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-foreground text-sm">{rec.productName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">SKU: {rec.sku}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-foreground text-xs">
                        {rec.batchQuantity} pcs
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium">
                          {new Date(rec.expiryDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <div className="mt-1">
                        {rec.urgency === 'URGENT' && (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 font-bold">
                            {rec.daysToExpiry <= 0 ? 'Expired' : `${rec.daysToExpiry}d left (Urgent)`}
                          </Badge>
                        )}
                        {rec.urgency === 'HIGH' && (
                          <Badge className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0 h-4 font-bold hover:bg-amber-100">
                            {rec.daysToExpiry}d left
                          </Badge>
                        )}
                        {rec.urgency === 'MEDIUM' && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                            {rec.daysToExpiry}d left
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="font-mono font-bold">{rec.dailySalesVelocity} pcs/day</div>
                      <div className="text-[10px] text-muted-foreground">
                        {rec.projectedDaysToSellOut > 90
                          ? 'Slow moving'
                          : `Est. ${rec.projectedDaysToSellOut}d to sell out`}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="line-through text-muted-foreground text-xs">
                          ₹{rec.originalPrice.toFixed(0)}
                        </span>
                        <span className="font-black text-emerald-600 text-sm">
                          ₹{rec.discountedPrice.toFixed(0)}
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold px-1.5 py-0">
                          {rec.discountPercentage}% OFF
                        </Badge>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600">
                      +₹{rec.revenueRecovered.toLocaleString('en-IN')}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        disabled={applyingProductId === rec.productId}
                        onClick={() => handleApplyMarkdown(rec)}
                        className="h-8 text-xs gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        <span>
                          {applyingProductId === rec.productId ? 'Applying...' : 'Apply Clearance'}
                        </span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
