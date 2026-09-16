import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { DynamicMarkdownService } from './dynamic-markdown.service.js';
import { PrismaService } from '../prisma.service.js';

const mockStoreId = 'store-1';

const mockExpiringBatch = {
  id: 'batch-1',
  storeId: mockStoreId,
  quantity: 20,
  expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4), // 4 days left
  product: {
    id: 'prod-1',
    name: 'Fresh Milk 1L',
    sku: 'MILK-001',
    costPrice: 40,
    sellingPrice: 50,
    description: 'Dairy milk',
  },
};

const mockPrisma = {
  productBatch: {
    findMany: jest.fn(),
  },
  stockMovement: {
    findMany: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

describe('DynamicMarkdownService', () => {
  let service: DynamicMarkdownService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamicMarkdownService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DynamicMarkdownService>(DynamicMarkdownService);
    jest.clearAllMocks();
  });

  describe('getMarkdownRecommendations', () => {
    it('calculates urgency and discount percentages for batches near expiry', async () => {
      (mockPrisma.productBatch.findMany as any).mockResolvedValue([mockExpiringBatch]);
      (mockPrisma.stockMovement.findMany as any).mockResolvedValue([
        { quantityChange: -2 },
        { quantityChange: -2 },
      ]); // 4 sold in 14 days

      const result = await service.getMarkdownRecommendations(mockStoreId);

      expect(result.totalExpiringBatches).toBe(1);
      expect(result.recommendations).toHaveLength(1);
      const rec = result.recommendations[0];
      expect(rec.daysToExpiry).toBeLessThanOrEqual(5);
      expect(rec.urgency).toBe('URGENT');
      expect(rec.discountPercentage).toBe(40); // 40% discount for <= 5 days
      expect(rec.discountedPrice).toBe(30); // 50 * (1 - 0.40) = 30
    });
  });

  describe('applyMarkdown', () => {
    it('updates product selling price with clearance discount', async () => {
      (mockPrisma.product.findFirst as any).mockResolvedValue(mockExpiringBatch.product);
      (mockPrisma.product.update as any).mockResolvedValue({
        ...mockExpiringBatch.product,
        sellingPrice: 30,
      });

      const result = await service.applyMarkdown(mockStoreId, {
        productId: 'prod-1',
        discountedPrice: 30,
        reason: 'Expiring in 4 days',
      });

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod-1' },
          data: expect.objectContaining({
            sellingPrice: 30,
          }),
        }),
      );
      expect(result.newPrice).toBe(30);
    });
  });
});
