import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SalesService } from './sales.service.js';
import { PrismaService } from '../prisma.service.js';

// ── Mocks ──────────────────────────────────────────────────────────────────────
const mockStoreId = 'store-1';
const mockProduct = {
  id: 'prod-1',
  storeId: mockStoreId,
  name: 'Parachute Oil',
  sku: 'OIL-001',
  stock: 50,
  reorderLevel: 10,
  sellingPrice: 25.0,
  costPrice: 20.0,
};

const mockSale = {
  id: 'sale-1',
  storeId: mockStoreId,
  invoiceNumber: 'INV-123',
  saleDate: new Date(),
  totalAmount: 50.0,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [
    {
      id: 'item-1',
      saleId: 'sale-1',
      productId: 'prod-1',
      quantity: 2,
      unitPrice: 25.0,
      totalPrice: 50.0,
      product: mockProduct,
    },
  ],
  stockMovements: [],
};

// Transaction mock — executes the callback immediately
const mockTx = {
  product: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  sale: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  saleItem: {
    create: jest.fn(),
  },
  stockMovement: {
    create: jest.fn(),
  },
  productBatch: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

const mockPrisma = {
  sale: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((cb: any) => cb(mockTx)),
};

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const createDto = {
      items: [{ productId: 'prod-1', quantity: 2, unitPrice: 25.0 }],
    };

    beforeEach(() => {
      mockTx.product.findFirst.mockResolvedValue(mockProduct);
      mockTx.sale.create.mockResolvedValue(mockSale);
      mockTx.saleItem.create.mockResolvedValue(mockSale.items[0]);
      mockTx.product.update.mockResolvedValue({ ...mockProduct, stock: 48 });
      mockTx.stockMovement.create.mockResolvedValue({});
      mockTx.productBatch.findMany.mockResolvedValue([]);
      mockTx.sale.findUnique.mockResolvedValue(mockSale);
    });

    it('should create a sale and return it with items', async () => {
      const result = await service.create(mockStoreId, createDto);

      expect(result).toBeDefined();
      expect(mockTx.sale.create).toHaveBeenCalledTimes(1);
      expect(mockTx.saleItem.create).toHaveBeenCalledTimes(1);
    });

    it('should decrement product stock', async () => {
      await service.create(mockStoreId, createDto);

      expect(mockTx.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'prod-1' },
          data: { stock: { decrement: 2 } },
        }),
      );
    });

    it('should create a stock movement of type SALE', async () => {
      await service.create(mockStoreId, createDto);

      expect(mockTx.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            storeId: mockStoreId,
            type: 'SALE',
            quantityChange: -2,
            productId: 'prod-1',
          }),
        }),
      );
    });

    it('should throw BadRequestException if product not found in store', async () => {
      mockTx.product.findFirst.mockResolvedValue(null);

      await expect(service.create(mockStoreId, createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(mockStoreId, createDto)).rejects.toThrow('Product does not exist in this store');
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      mockTx.product.findFirst.mockResolvedValue({ ...mockProduct, stock: 1 });

      await expect(
        service.create(mockStoreId, { items: [{ productId: 'prod-1', quantity: 10, unitPrice: 25 }] }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(mockStoreId, { items: [{ productId: 'prod-1', quantity: 10, unitPrice: 25 }] }),
      ).rejects.toThrow('Insufficient stock');
    });

    it('should throw ConflictException on duplicate invoice number', async () => {
      mockPrisma.$transaction.mockRejectedValueOnce({ code: 'P2002' });

      await expect(service.create(mockStoreId, createDto)).rejects.toThrow(ConflictException);
    });

    it('should use provided invoiceNumber if given', async () => {
      await service.create(mockStoreId, { ...createDto, invoiceNumber: 'INV-CUSTOM' });

      expect(mockTx.sale.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ invoiceNumber: 'INV-CUSTOM', storeId: mockStoreId }),
        }),
      );
    });

    it('should apply FEFO batch deduction when batches exist', async () => {
      mockTx.productBatch.findMany.mockResolvedValue([
        { id: 'batch-1', quantity: 5, expiryDate: new Date('2026-08-01') },
        { id: 'batch-2', quantity: 10, expiryDate: new Date('2026-12-01') },
      ]);

      await service.create(mockStoreId, { items: [{ productId: 'prod-1', quantity: 3, unitPrice: 25 }] });

      expect(mockTx.productBatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'batch-1' },
          data: { quantity: { decrement: 3 } },
        }),
      );
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all sales ordered by createdAt desc for store', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([mockSale]);

      const result = await service.findAll(mockStoreId);

      expect(result).toHaveLength(1);
      expect(result[0].invoiceNumber).toBe('INV-123');
      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: mockStoreId },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a sale by id and storeId', async () => {
      mockPrisma.sale.findFirst.mockResolvedValue(mockSale);

      const result = await service.findOne(mockStoreId, 'sale-1');

      expect(result.id).toBe('sale-1');
    });

    it('should throw NotFoundException if sale not found in store', async () => {
      mockPrisma.sale.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockStoreId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});