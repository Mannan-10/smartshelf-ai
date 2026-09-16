import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { AutoPOService } from './auto-po.service.js';
import { PrismaService } from '../prisma.service.js';

const mockStoreId = 'store-1';

const mockLowProduct = {
  id: 'prod-1',
  storeId: mockStoreId,
  name: 'Wheat Flour 10kg',
  sku: 'FLOUR-001',
  stock: 4,
  reorderLevel: 10,
  costPrice: 200,
  sellingPrice: 250,
  isArchived: false,
};

const mockVendor = {
  id: 'vendor-1',
  storeId: mockStoreId,
  name: 'Grain Wholesale Ltd',
  email: 'grain@example.com',
  phone: '1234567890',
};

const mockPO = {
  id: 'po-1',
  storeId: mockStoreId,
  vendorId: 'vendor-1',
  orderNumber: 'AUTO-123456',
  orderDate: new Date(),
  totalAmount: 3200,
  notes: '[Auto-PO] Restock',
  vendor: mockVendor,
  items: [],
};

const mockPrisma = {
  product: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  vendor: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  purchaseOrderItem: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  purchaseOrder: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

describe('AutoPOService', () => {
  let service: AutoPOService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoPOService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AutoPOService>(AutoPOService);
    jest.clearAllMocks();
  });

  describe('getRestockSuggestions', () => {
    it('groups low stock products by preferred vendor and suggests reorder quantities', async () => {
      (mockPrisma.product.findMany as any).mockResolvedValue([mockLowProduct]);
      (mockPrisma.vendor.findMany as any).mockResolvedValue([mockVendor]);
      (mockPrisma.purchaseOrderItem.findFirst as any).mockResolvedValue({
        unitCost: 200,
        purchaseOrder: { vendor: mockVendor },
      });

      const result = await service.getRestockSuggestions(mockStoreId);

      expect(result.totalLowStockItems).toBe(1);
      expect(result.vendorGroups).toHaveLength(1);
      expect(result.vendorGroups[0].vendorId).toBe('vendor-1');
      // Target: max(10*2, 20) = 20. Recommended = 20 - 4 = 16.
      expect(result.vendorGroups[0].items[0].recommendedOrderQty).toBe(16);
      expect(result.vendorGroups[0].items[0].urgency).toBe('HIGH');
    });
  });

  describe('generateAutoPO', () => {
    it('creates a pending PurchaseOrder with line items for the specified vendor', async () => {
      (mockPrisma.vendor.findFirst as any).mockResolvedValue(mockVendor);
      (mockPrisma.product.findMany as any).mockResolvedValue([mockLowProduct]);
      (mockPrisma.purchaseOrder.create as any).mockResolvedValue(mockPO);
      (mockPrisma.purchaseOrder.findUnique as any).mockResolvedValue(mockPO);

      const result = await service.generateAutoPO(mockStoreId, {
        vendorId: 'vendor-1',
        items: [{ productId: 'prod-1', quantity: 16, unitCost: 200 }],
        notes: 'Emergency restock',
      });

      expect(mockPrisma.purchaseOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            storeId: mockStoreId,
            vendorId: 'vendor-1',
            totalAmount: 3200,
          }),
        }),
      );
      expect(result).toEqual(mockPO);
    });
  });
});
