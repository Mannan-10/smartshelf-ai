import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ShelvesService } from './shelves.service.js';
import { PrismaService } from '../prisma.service.js';
import { StockMovementType } from '../generated/prisma/client.js';

const mockStoreId = 'store-1';

const mockShelf = {
  id: 'shelf-1',
  storeId: mockStoreId,
  code: 'A1-R1-S1',
  aisle: 'Aisle 1',
  rack: 'Rack 1',
  shelf: 'Shelf 1',
  bin: null,
  capacity: 100,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  products: [
    {
      id: 'prod-1',
      name: 'Rice Bag 5kg',
      sku: 'RICE-001',
      stock: 40,
      sellingPrice: 250,
      reorderLevel: 10,
    },
  ],
  productBatches: [
    {
      id: 'batch-1',
      quantity: 40,
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 60 days
    },
  ],
};

const mockPrisma = {
  shelfLocation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  productBatch: {
    updateMany: jest.fn(),
  },
  stockMovement: {
    create: jest.fn(),
  },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

describe('ShelvesService', () => {
  let service: ShelvesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShelvesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ShelvesService>(ShelvesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a shelf location and auto-generates code', async () => {
      (mockPrisma.shelfLocation.findFirst as any).mockResolvedValue(null);
      (mockPrisma.shelfLocation.create as any).mockResolvedValue(mockShelf);

      const result = await service.create(mockStoreId, {
        aisle: 'Aisle 1',
        rack: 'Rack 1',
        shelf: 'Shelf 1',
        capacity: 100,
      });

      expect(mockPrisma.shelfLocation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            storeId: mockStoreId,
            code: 'AISL-RACK-SHEL',
            aisle: 'Aisle 1',
            capacity: 100,
          }),
        }),
      );
      expect(result).toEqual(mockShelf);
    });

    it('throws ConflictException if code already exists', async () => {
      (mockPrisma.shelfLocation.findFirst as any).mockResolvedValue(mockShelf);

      await expect(
        service.create(mockStoreId, {
          code: 'A1-R1-S1',
          aisle: 'Aisle 1',
          rack: 'Rack 1',
          shelf: 'Shelf 1',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns shelves with calculated occupancy percentage and status', async () => {
      (mockPrisma.shelfLocation.findMany as any).mockResolvedValue([mockShelf]);

      const results = await service.findAll(mockStoreId);

      expect(results).toHaveLength(1);
      expect(results[0].occupancyPercentage).toBe(40); // 40 / 100 = 40%
      expect(results[0].status).toBe('NORMAL');
    });

    it('flags CRITICAL if current stock is 0', async () => {
      const emptyShelf = {
        ...mockShelf,
        products: [],
        productBatches: [],
      };
      (mockPrisma.shelfLocation.findMany as any).mockResolvedValue([
        emptyShelf,
      ]);

      const results = await service.findAll(mockStoreId);
      expect(results[0].status).toBe('CRITICAL');
      expect(results[0].occupancyPercentage).toBe(0);
    });
  });

  describe('findOne', () => {
    it('returns a single shelf location if found', async () => {
      (mockPrisma.shelfLocation.findFirst as any).mockResolvedValue(mockShelf);

      const result = await service.findOne(mockStoreId, 'shelf-1');
      expect(result.code).toBe('A1-R1-S1');
      expect(result.occupancyPercentage).toBe(40);
    });

    it('throws NotFoundException if shelf does not exist', async () => {
      (mockPrisma.shelfLocation.findFirst as any).mockResolvedValue(null);

      await expect(
        service.findOne(mockStoreId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reconcileAudit', () => {
    it('adjusts product stock and creates stock movements on variance', async () => {
      (mockPrisma.shelfLocation.findFirst as any).mockResolvedValue(mockShelf);
      (mockPrisma.product.findFirst as any).mockResolvedValue({
        id: 'prod-1',
        name: 'Rice Bag 5kg',
        stock: 40,
      });

      const auditResult = await service.reconcileAudit(mockStoreId, 'shelf-1', {
        items: [{ productId: 'prod-1', countedQuantity: 38 }], // -2 variance
        notes: 'Monthly physical audit',
      });

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stock: 38 },
      });
      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            storeId: mockStoreId,
            productId: 'prod-1',
            type: StockMovementType.ADJUSTMENT,
            quantityChange: -2,
            stockBefore: 40,
            stockAfter: 38,
          }),
        }),
      );
      expect(auditResult.itemsAdjustedCount).toBe(1);
      expect(auditResult.netVariance).toBe(-2);
    });
  });
});
