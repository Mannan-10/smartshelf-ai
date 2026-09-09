import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { PrismaService } from '../prisma.service.js';

// ── Mocks ──────────────────────────────────────────────────────────────────────
const mockStoreId = 'store-1';
const mockCategory = { id: 'cat-1', name: 'Electronics', storeId: mockStoreId };

const mockProduct = {
  id: 'prod-1',
  storeId: mockStoreId,
  name: 'Parachute Oil',
  sku: 'OIL-001',
  description: 'Hair oil',
  categoryId: 'cat-1',
  category: mockCategory,
  stock: 50,
  reorderLevel: 10,
  costPrice: 20.0,
  sellingPrice: 25.0,
  expiryDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  product: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  category: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  productBatch: {
    findMany: jest.fn(),
  },
};

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    const createDto = {
      name: 'Parachute Oil',
      sku: 'OIL-001',
      stock: 50,
      reorderLevel: 10,
      categoryId: 'cat-1',
    };

    it('should create and return a product', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(mockStoreId, createDto);

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.create).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException if category does not exist in store', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(service.create(mockStoreId, createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(mockStoreId, createDto)).rejects.toThrow('Category does not exist in this store');
    });

    it('should throw ConflictException on duplicate SKU in store', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(mockCategory);
      mockPrisma.product.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create(mockStoreId, createDto)).rejects.toThrow(ConflictException);
    });

    it('should create product without category when categoryId is null', async () => {
      mockPrisma.product.create.mockResolvedValue({ ...mockProduct, categoryId: null, category: null });

      const result = await service.create(mockStoreId, { ...createDto, categoryId: null });

      expect(mockPrisma.category.findFirst).not.toHaveBeenCalled();
      expect(result.categoryId).toBeNull();
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all products for store', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.findAll(mockStoreId);

      expect(result).toHaveLength(1);
      expect(result[0].sku).toBe('OIL-001');
    });

    it('should return empty array when no products exist in store', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockStoreId);

      expect(result).toEqual([]);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a product by id and storeId', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockStoreId, 'prod-1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found in store', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockStoreId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    const updateDto = { name: 'Updated Oil', stock: 60 };

    it('should update and return the product', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, ...updateDto });

      const result = await service.update(mockStoreId, 'prod-1', updateDto);

      expect(result.name).toBe('Updated Oil');
      expect(result.stock).toBe(60);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.update(mockStoreId, 'nonexistent', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should soft delete product successfully', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(mockProduct);
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, isArchived: true });

      await expect(service.remove(mockStoreId, 'prod-1')).resolves.not.toThrow();
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { isArchived: true },
      });
    });

    it('should throw NotFoundException if product not found in store', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.remove(mockStoreId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getBatches ───────────────────────────────────────────────────────────────

  describe('getBatches', () => {
    it('should return product with its active batches', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({
        id: 'prod-1', name: 'Parachute Oil', sku: 'OIL-001',
      });
      mockPrisma.productBatch.findMany.mockResolvedValue([
        { id: 'batch-1', quantity: 20, expiryDate: new Date('2026-12-01') },
      ]);

      const result = await service.getBatches(mockStoreId, 'prod-1');

      expect(result.product.id).toBe('prod-1');
      expect(result.batches).toHaveLength(1);
    });

    it('should throw NotFoundException if product not found in store', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.getBatches(mockStoreId, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});