export type RestockUrgency = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export type ProductRestockItem = {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  recommendedOrderQty: number;
  unitCost: number;
  totalCost: number;
  urgency: RestockUrgency;
  vendorId?: string | null;
  vendorName?: string | null;
};

export type VendorRestockGroup = {
  vendorId: string;
  vendorName: string;
  vendorEmail?: string | null;
  vendorPhone?: string | null;
  items: ProductRestockItem[];
  totalUnits: number;
  totalCost: number;
};

export type RestockSuggestionsResponse = {
  totalLowStockItems: number;
  totalEstimatedCost: number;
  vendorGroups: VendorRestockGroup[];
  allVendors: Array<{
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
  }>;
};

export type AutoPOItemPayload = {
  productId: string;
  quantity: number;
  unitCost: number;
  expiryDate?: string;
};

export type GenerateAutoPOPayload = {
  vendorId: string;
  items: AutoPOItemPayload[];
  notes?: string;
};

export type MarkdownRecommendation = {
  batchId: string;
  productId: string;
  productName: string;
  sku: string;
  batchQuantity: number;
  expiryDate: string;
  daysToExpiry: number;
  dailySalesVelocity: number;
  projectedDaysToSellOut: number;
  originalPrice: number;
  discountPercentage: number;
  discountedPrice: number;
  revenueAtRisk: number;
  revenueRecovered: number;
  urgency: 'URGENT' | 'HIGH' | 'MEDIUM';
};

export type MarkdownRecommendationsResponse = {
  totalExpiringBatches: number;
  totalRevenueAtRisk: number;
  potentialRevenueSaved: number;
  recommendations: MarkdownRecommendation[];
};

export type ApplyMarkdownPayload = {
  productId: string;
  discountedPrice: number;
  reason?: string;
};
