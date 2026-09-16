'use client';

import { useState, useEffect, useCallback } from 'react';
import { automationApi } from '@/lib/automation-api';
import type { RestockSuggestionsResponse, VendorRestockGroup } from '@/types/automation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Truck,
  PackagePlus,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export function AutoPOPanel() {
  const [data, setData] = useState<RestockSuggestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingVendorId, setGeneratingVendorId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await automationApi.getRestockSuggestions();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load restock suggestions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  const handleGeneratePO = async (group: VendorRestockGroup) => {
    if (group.vendorId === 'unassigned') {
      alert('Please assign a vendor to these products in the vendor catalog before generating an automated PO.');
      return;
    }

    setGeneratingVendorId(group.vendorId);
    setSuccessMessage(null);
    try {
      const res = await automationApi.generateAutoPO({
        vendorId: group.vendorId,
        items: group.items.map((it) => ({
          productId: it.id,
          quantity: it.recommendedOrderQty,
          unitCost: it.unitCost,
        })),
        notes: `AI Restock Assistant Auto-PO for ${group.items.length} items.`,
      });

      setSuccessMessage(
        `Draft Purchase Order #${res.orderNumber} successfully generated for ${group.vendorName}!`
      );
      // Reload suggestions to reflect any state
      await loadSuggestions();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to generate auto purchase order');
    } finally {
      setGeneratingVendorId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
        Analyzing inventory stock levels, consumption velocity, and vendor catalogs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive text-xs rounded-xl flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const groups = data?.vendorGroups || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-blue-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>AI Automated Restock Assistant (Auto-PO)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            Proactively identifies stock reaching reorder thresholds, calculates recommended buffer quantities,
            and batches them by supplier for 1-click draft PO creation.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase font-bold">Items to Reorder</div>
            <div className="text-2xl font-black text-foreground">{data?.totalLowStockItems || 0}</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase font-bold">Est. Investment</div>
            <div className="text-2xl font-black text-emerald-600">
              ₹{data?.totalEstimatedCost.toLocaleString('en-IN') || 0}
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <Link
            href="/purchases"
            className="flex items-center gap-1 font-bold underline hover:opacity-80"
          >
            <span>Go to Purchases</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="py-16 text-center border rounded-2xl bg-background">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-foreground">Stock Levels Healthy!</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            All catalog items are currently above their reorder thresholds. No emergency restock orders are needed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.vendorId}
              className="border rounded-2xl bg-background overflow-hidden shadow-sm hover:shadow-md transition"
            >
              {/* Vendor Group Header */}
              <div className="bg-muted/40 px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <span>{group.vendorName}</span>
                      {group.vendorId === 'unassigned' && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                          Needs Vendor Assignment
                        </Badge>
                      )}
                    </h3>
                    {(group.vendorEmail || group.vendorPhone) && (
                      <p className="text-[11px] text-muted-foreground">
                        {group.vendorEmail} {group.vendorPhone && `• ${group.vendorPhone}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right pr-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Batch Cost</span>
                    <div className="font-extrabold text-sm text-emerald-600">
                      ₹{group.totalCost.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    disabled={generatingVendorId === group.vendorId || group.vendorId === 'unassigned'}
                    onClick={() => handleGeneratePO(group)}
                    className="h-8 gap-1.5 text-xs shadow-sm"
                  >
                    <PackagePlus className="h-3.5 w-3.5" />
                    <span>
                      {generatingVendorId === group.vendorId
                        ? 'Drafting PO...'
                        : `Generate Draft PO (${group.items.length} items)`}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Items List Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/20 text-muted-foreground uppercase text-[10px] border-b">
                    <tr>
                      <th className="px-5 py-2.5">Product</th>
                      <th className="px-4 py-2.5">SKU</th>
                      <th className="px-4 py-2.5 text-center">Current Stock</th>
                      <th className="px-4 py-2.5 text-center">Reorder Level</th>
                      <th className="px-4 py-2.5 text-center">Recommended Order</th>
                      <th className="px-4 py-2.5 text-right">Est. Unit Cost</th>
                      <th className="px-5 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {group.items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/10 transition">
                        <td className="px-5 py-3 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.urgency === 'CRITICAL' && (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4">
                                Out of Stock
                              </Badge>
                            )}
                            {item.urgency === 'HIGH' && (
                              <Badge className="bg-amber-100 text-amber-800 text-[9px] px-1 py-0 h-4 hover:bg-amber-100">
                                Low Stock
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{item.sku}</td>
                        <td className="px-4 py-3 text-center font-bold font-mono">
                          <span className={item.currentStock === 0 ? 'text-destructive' : 'text-foreground'}>
                            {item.currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground font-mono">
                          {item.reorderLevel}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-extrabold text-primary font-mono text-xs px-2 py-0.5 rounded bg-primary/10">
                            +{item.recommendedOrderQty} units
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          ₹{item.unitCost.toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-foreground">
                          ₹{item.totalCost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
