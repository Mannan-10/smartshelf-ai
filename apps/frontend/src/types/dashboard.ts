export type DashboardSummary = {
  products: {
    total: number;
    lowStock: number;
    expiring: number;
  };
  sales: {
    allTime: { count: number; revenue: number };
    thisMonth: { count: number; revenue: number };
  };
  topProducts: {
    productId: string;
    name: string;
    sku: string;
    totalQuantitySold: number;
    totalRevenue: number;
  }[];
  recentSales: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    createdAt: string;
    items: { product: { name: string }; quantity: number }[];
  }[];
};