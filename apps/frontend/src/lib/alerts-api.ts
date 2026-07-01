export type AlertsSummary = {
  lowStock: number;
  expiring: number;
  expired: number;
};

export type LowStockProduct = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  reorderLevel: number;
  category: { name: string } | null;
};

export type ExpiringProduct = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  expiryDate: string;
  category: { name: string } | null;
};

async function apiRequest<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data as T;
}

export const alertsApi = {
  getSummary: () => apiRequest<AlertsSummary>('/api/alerts/summary'),
  getLowStock: () => apiRequest<LowStockProduct[]>('/api/alerts/low-stock'),
  getExpiring: (days = 30) => apiRequest<ExpiringProduct[]>(`/api/alerts/expiring?days=${days}`),
};