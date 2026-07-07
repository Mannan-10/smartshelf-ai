'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type WeekData = {
  week: string;   // "2026-06-29"
  revenue: number;
  count: number;
};

function formatWeek(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatRupee(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-medium mb-1">{label}</p>
      <p className="text-emerald-600">Revenue: ₹{Number(payload[0]?.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
      <p className="text-muted-foreground">Sales: {payload[1]?.value}</p>
    </div>
  );
}

export function SalesTrendChart() {
  const [data, setData] = useState<WeekData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/weekly-trend', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setError('Failed to load trend data'))
      .finally(() => setIsLoading(false));
  }, []);

  const chartData = data.map((d) => ({
    ...d,
    weekLabel: formatWeek(d.week),
  }));

  return (
    <div className="rounded-xl border bg-background shadow-sm">
      <div className="border-b px-5 py-4">
        <h3 className="font-semibold">Weekly sales trend</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Revenue over the last 8 weeks</p>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="h-56 animate-pulse rounded-lg bg-muted" />
        ) : error ? (
          <p className="py-10 text-center text-sm text-destructive">{error}</p>
        ) : chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No sales data yet. Record some sales to see the trend.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="weekLabel"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatRupee}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                yAxisId={0}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}