'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

type ReportType = 'sales' | 'inventory';

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
    </svg>
  );
}

function ReportCard({
  title,
  description,
  type,
  rows,
}: {
  title: string;
  description: string;
  type: ReportType;
  rows: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setIsDownloading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${type}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `${type}-report-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-background p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <p className="mt-3 text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded w-fit">
            {rows}
          </p>
        </div>
        <div className="shrink-0">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-2"
          >
            <DownloadIcon />
            {isDownloading ? 'Preparing...' : 'Download CSV'}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

export function ReportsManager() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download data exports for analysis in Excel or Google Sheets
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ReportCard
          title="Sales report"
          description="All sales invoices with line items — product name, SKU, quantity, unit price, and totals."
          type="sales"
          rows="Columns: Invoice, Date, Product, SKU, Qty, Unit Price, Line Total, Invoice Total, Notes"
        />

        <ReportCard
          title="Inventory report"
          description="Full product catalog with current stock levels, reorder status, pricing, and expiry dates."
          type="inventory"
          rows="Columns: Name, SKU, Category, Stock, Reorder Level, Status, Cost Price, Selling Price, Expiry"
        />
      </div>

      <div className="rounded-xl border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">💡 Tip</p>
        <p>Reports export all data up to the current moment. Open the CSV in Excel or Google Sheets — the headers are in the first row and each row is one product / sale line item.</p>
      </div>
    </div>
  );
}