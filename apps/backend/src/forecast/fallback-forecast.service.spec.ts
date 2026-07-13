import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { FallbackForecastService } from './fallback-forecast.service.js';
import { PrismaService } from '../prisma.service.js';
import { StockMovementType } from '../generated/prisma/client.js';

const mockProduct = {
  id: 'prod-1',
  name: 'Parachute Oil',
  sku: 'OIL-001',
  stock: 50,
  reorderLevel: 10,
};

const mockMovements = [
  { quantityChange: -3, createdAt: new Date() },
  { quantityChange: -2, createdAt: new Date() },
];

const mockPrisma = {
  product: { findUnique: jest.fn() },
  stockMovement: { findMany: jest.fn() },
};

describe('FallbackForecastService', () => {
  let service: FallbackForecastService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FallbackForecastService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FallbackForecastService>(FallbackForecastService);
    jest.clearAllMocks();
  });

  describe('forecastProduct', () => {
    it('should return fallback forecast with 7-day rolling average', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.stockMovement.findMany.mockResolvedValue(mockMovements);

      const result = await service.forecastProduct('prod-1');

      expect(result).not.toBeNull();
      expect(result!.fallback).toBe(true);
      expect(result!.forecast.forecast7Days).toHaveLength(7);
      expect(result!.forecast.avgDailyQuantity).toBeGreaterThanOrEqual(0);
    });

    it('should return null if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      const result = await service.forecastProduct('nonexistent');

      expect(result).toBeNull();
    });

    it('should return 0 avg when no sales in last 7 days', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.stockMovement.findMany.mockResolvedValue([]);

      const result = await service.forecastProduct('prod-1');

      expect(result!.forecast.avgDailyQuantity).toBe(0);
      expect(result!.forecast.forecastTotal7Days).toBe(0);
    });

    it('should set daysUntilStockout to null when avgDailyQuantity is 0', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.stockMovement.findMany.mockResolvedValue([]);

      const result = await service.forecastProduct('prod-1');

      expect(result!.forecast.daysUntilStockout).toBeNull();
    });

    it('should set reorderRecommended true when stock <= reorderLevel', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ ...mockProduct, stock: 5 });
      mockPrisma.stockMovement.findMany.mockResolvedValue(mockMovements);

      const result = await service.forecastProduct('prod-1');

      expect(result!.forecast.reorderRecommended).toBe(true);
    });

    it('should query only SALE type movements from last 7 days', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.stockMovement.findMany.mockResolvedValue([]);

      await service.forecastProduct('prod-1');

      expect(mockPrisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productId: 'prod-1',
            type: StockMovementType.SALE,
          }),
        }),
      );
    });

    it('should include fallbackReason in response', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
      mockPrisma.stockMovement.findMany.mockResolvedValue([]);

      const result = await service.forecastProduct('prod-1');

      expect(result!.fallbackReason).toBeDefined();
      expect(typeof result!.fallbackReason).toBe('string');
    });
  });
});