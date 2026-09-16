export type ShelfHealthStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

export type ShelfProduct = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  sellingPrice: number;
  reorderLevel: number;
  category?: {
    id: string;
    name: string;
  } | null;
  batches?: Array<{
    id: string;
    quantity: number;
    expiryDate: string | null;
  }>;
};

export type ShelfBatch = {
  id: string;
  quantity: number;
  expiryDate: string | null;
  product?: {
    id: string;
    name: string;
  };
};

export type ShelfLocation = {
  id: string;
  storeId?: string | null;
  code: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin?: string | null;
  capacity: number;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  currentStock: number;
  occupancyPercentage: number;
  status: ShelfHealthStatus;
  expiredBatchCount: number;
  expiringSoonBatchCount: number;
  products?: ShelfProduct[];
  productBatches?: ShelfBatch[];
};

export type CreateShelfPayload = {
  code?: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin?: string;
  capacity?: number;
  notes?: string;
};

export type UpdateShelfPayload = Partial<CreateShelfPayload>;

export type AuditItemPayload = {
  productId: string;
  countedQuantity: number;
  notes?: string;
};

export type AuditReconcilePayload = {
  items: AuditItemPayload[];
  notes?: string;
};

export type AuditDetail = {
  productId: string;
  productName: string;
  stockBefore: number;
  countedQuantity: number;
  variance: number;
};

export type AuditResult = {
  shelfId: string;
  shelfCode: string;
  totalItemsCounted: number;
  itemsAdjustedCount: number;
  netVariance: number;
  auditedAt: string;
  details: AuditDetail[];
};
