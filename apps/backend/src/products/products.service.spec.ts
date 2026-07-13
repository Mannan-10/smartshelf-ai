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
const mockCategory = { id: 'cat-1', name: 'Electronics' };

const mockProduct = {
  id: 'prod-1',
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
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  category: {
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
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(createDto);

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.create).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException if category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow('Category does not exist');
    });

    it('should throw ConflictException on duplicate SKU', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(mockCategory);
      mockPrisma.product.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should create product without category when categoryId is null', async () => {
      mockPrisma.product.create.mockResolvedValue({ ...mockProduct, categoryId: null, category: null });

      const result = await service.create({ ...createDto, categoryId: null });

      expect(mockPrisma.category.findUnique).not.toHaveBeenCalled();
      expect(result.categoryId).toBeNull();
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return all products', async () => {
      mockPrisma.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].sku).toBe('OIL-001');
    });

    it('should return empty array when no products exist', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a product by id', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('prod-1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    const updateDto = { name: 'Updated Oil', stock: 60 };

    it('should update and return the product', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null); // no categoryId in dto
      mockPrisma.product.update.mockResolvedValue({ ...mockProduct, ...updateDto });

      const result = await service.update('prod-1', updateDto);

      expect(result.name).toBe('Updated Oil');
      expect(result.stock).toBe(60);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrisma.product.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException on duplicate SKU during update', async () => {
      mockPrisma.product.update.mockRejectedValue({ code: 'P2002' });

      await expect(service.update('prod-1', { sku: 'EXISTING-SKU' })).rejects.toThrow(ConflictException);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete a product successfully', async () => {
      mockPrisma.product.delete.mockResolvedValue(mockProduct);

      await expect(service.remove('prod-1')).resolves.not.toThrow();
      expect(mockPrisma.product.delete).toHaveBeenCalledWith({ where: { id: 'prod-1' } });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ── getBatches ───────────────────────────────────────────────────────────────

  describe('getBatches', () => {
    it('should return product with its active batches', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'prod-1', name: 'Parachute Oil', sku: 'OIL-001',
      });
      mockPrisma.productBatch.findMany.mockResolvedValue([
        { id: 'batch-1', quantity: 20, expiryDate: new Date('2026-12-01') },
      ]);

      const result = await service.getBatches('prod-1');

      expect(result.product.id).toBe('prod-1');
      expect(result.batches).toHaveLength(1);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getBatches('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});