'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type TopProduct = {
  productId: string;
  name: string;
  sku: string;
  totalQuantitySold: number;
  totalRevenue: number;
};

type Props = {
  data: TopProduct[];
};

const BAR_COLORS = [
  'hsl(var(--primary))',
  'hsl(221, 83%, 63%)',
  'hsl(262, 83%, 63%)',
  'hsl(316, 70%, 55%)',
  'hsl(175, 70%, 41%)',
];

function formatRupee(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as TopProduct;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-medium mb-1">{d.name}</p>
      <p className="text-muted-foreground font-mono text-xs mb-1">{d.sku}</p>
      <p style={{ color: payload[0]?.fill }}>
        Revenue: ₹{Number(d.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </p>
      <p className="text-muted-foreground">Units sold: {d.totalQuantitySold}</p>
    </div>
  );
}

export function TopProductsChart({ data }: Props) {
  // Truncate long product names for X-axis
  const chartData = data.map((d) => ({
    ...d,
    shortName: d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
  }));

  return (
    <div className="rounded-xl border bg-background shadow-sm">
      <div className="border-b px-5 py-4">
        <h3 className="font-semibold">Top 5 products</h3>
        <p className="text-xs text-muted-foreground mt-0.5">By total revenue, all time</p>
      </div>

      <div className="p-4">
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No sales data yet. Record some sales to see top products.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="shortName"
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
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} />
              <Bar dataKey="totalRevenue" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}