'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { alertsApi, type AlertsSummary } from '@/lib/alerts-api';

export function AlertsBanner() {
  const [summary, setSummary] = useState<AlertsSummary | null>(null);

  useEffect(() => {
    alertsApi.getSummary().then(setSummary).catch(() => null);
  }, []);

  if (!summary) return null;

  const total = summary.lowStock + summary.expiring + summary.expired;
  if (total === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {summary.lowStock > 0 && (
        <Link href="/alerts?tab=low-stock">
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 hover:bg-amber-100 transition-colors dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
            <span><strong>{summary.lowStock}</strong> low stock {summary.lowStock === 1 ? 'item' : 'items'}</span>
          </div>
        </Link>
      )}

      {summary.expired > 0 && (
        <Link href="/alerts?tab=expiring">
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 hover:bg-red-100 transition-colors dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
            <span><strong>{summary.expired}</strong> expired {summary.expired === 1 ? 'item' : 'items'}</span>
          </div>
        </Link>
      )}

      {summary.expiring > 0 && (
        <Link href="/alerts?tab=expiring">
          <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800 hover:bg-orange-100 transition-colors dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
            </svg>
            <span><strong>{summary.expiring}</strong> expiring in 30 days</span>
          </div>
        </Link>
      )}
    </div>
  );
}