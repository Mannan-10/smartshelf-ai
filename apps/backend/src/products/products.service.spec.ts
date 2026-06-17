import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { jest } from '@jest/globals';

import { ProductsService } from './products.service.js';
import { PrismaService } from '../prisma.service.js';
import type { CreateProductDto } from './dto/create-product.dto.js';
import type { UpdateProductDto } from './dto/update-product.dto.js';

type MockPrismaService = {
  category: {
    findUnique: jest.Mock;
  };
  product: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

describe('ProductsService', () => {
  let productsService: ProductsService;
  let prisma: MockPrismaService;

  const category = {
    id: 'cat-1',
    name: 'Medicines',
    description: 'Pharmacy products',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const product = {
    id: 'prod-1',
    name: 'Paracetamol 500mg',
    sku: 'MED-PARA-500',
    description: 'Pain relief tablet',
    categoryId: 'cat-1',
    category,
    stock: 100,
    reorderLevel: 20,
    costPrice: 8.5,
    sellingPrice: 12,
    expiryDate: new Date('2027-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      category: {
        findUnique: jest.fn(),
      },
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    productsService = new ProductsService(
      prisma as unknown as PrismaService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create product when category exists', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Paracetamol 500mg',
        sku: 'MED-PARA-500',
        description: 'Pain relief tablet',
        categoryId: 'cat-1',
        stock: 100,
        reorderLevel: 20,
        costPrice: 8.5,
        sellingPrice: 12,
        expiryDate: '2027-12-31',
      };

      prisma.category.findUnique.mockResolvedValue(category);
      prisma.product.create.mockResolvedValue(product);

      const result = await productsService.create(createProductDto);

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'cat-1',
        },
      });

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: 'Paracetamol 500mg',
          sku: 'MED-PARA-500',
          description: 'Pain relief tablet',
          categoryId: 'cat-1',
          stock: 100,
          reorderLevel: 20,
          costPrice: 8.5,
          sellingPrice: 12,
          expiryDate: expect.any(Date),
        },
        include: {
          category: true,
        },
      });

      expect(result).toBe(product);
    });

    it('should create product without category when categoryId is not passed', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Rice Bag 25kg',
        sku: 'GROC-RICE-25',
        stock: 50,
        reorderLevel: 10,
      };

      prisma.product.create.mockResolvedValue({
        ...product,
        id: 'prod-2',
        name: 'Rice Bag 25kg',
        sku: 'GROC-RICE-25',
        categoryId: null,
        category: null,
      });

      const result = await productsService.create(createProductDto);

      expect(prisma.category.findUnique).not.toHaveBeenCalled();

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: 'Rice Bag 25kg',
          sku: 'GROC-RICE-25',
          description: undefined,
          categoryId: undefined,
          stock: 50,
          reorderLevel: 10,
          costPrice: undefined,
          sellingPrice: undefined,
          expiryDate: undefined,
        },
        include: {
          category: true,
        },
      });

      expect(result.name).toBe('Rice Bag 25kg');
    });

    it('should throw BadRequestException when category does not exist', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Unknown Category Product',
        sku: 'UNKNOWN-001',
        categoryId: 'missing-category',
      };

      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        productsService.create(createProductDto),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when SKU already exists', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Duplicate SKU Product',
        sku: 'MED-PARA-500',
        categoryId: 'cat-1',
      };

      prisma.category.findUnique.mockResolvedValue(category);
      prisma.product.create.mockRejectedValue({
        code: 'P2002',
      });

      await expect(
        productsService.create(createProductDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all products with category data', async () => {
      prisma.product.findMany.mockResolvedValue([product]);

      const result = await productsService.findAll();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: true,
        },
      });

      expect(result).toEqual([product]);
    });
  });

  describe('findOne', () => {
    it('should return one product by id', async () => {
      prisma.product.findUnique.mockResolvedValue(product);

      const result = await productsService.findOne('prod-1');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'prod-1',
        },
        include: {
          category: true,
        },
      });

      expect(result).toBe(product);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        productsService.findOne('missing-product'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update product when category exists', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Paracetamol 650mg',
        categoryId: 'cat-1',
        stock: 75,
        sellingPrice: 15,
        expiryDate: '2028-01-15',
      };

      const updatedProduct = {
        ...product,
        name: 'Paracetamol 650mg',
        stock: 75,
        sellingPrice: 15,
        expiryDate: new Date('2028-01-15'),
      };

      prisma.category.findUnique.mockResolvedValue(category);
      prisma.product.update.mockResolvedValue(updatedProduct);

      const result = await productsService.update('prod-1', updateProductDto);

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'cat-1',
        },
      });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: {
          id: 'prod-1',
        },
        data: {
          name: 'Paracetamol 650mg',
          sku: undefined,
          description: undefined,
          categoryId: 'cat-1',
          stock: 75,
          reorderLevel: undefined,
          costPrice: undefined,
          sellingPrice: 15,
          expiryDate: expect.any(Date),
        },
        include: {
          category: true,
        },
      });

      expect(result).toBe(updatedProduct);
    });

    it('should allow removing expiryDate by passing null', async () => {
      const updateProductDto: UpdateProductDto = {
        expiryDate: null,
      };

      const updatedProduct = {
        ...product,
        expiryDate: null,
      };

      prisma.product.update.mockResolvedValue(updatedProduct);

      const result = await productsService.update('prod-1', updateProductDto);

      expect(prisma.category.findUnique).not.toHaveBeenCalled();

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: {
          id: 'prod-1',
        },
        data: {
          name: undefined,
          sku: undefined,
          description: undefined,
          categoryId: undefined,
          stock: undefined,
          reorderLevel: undefined,
          costPrice: undefined,
          sellingPrice: undefined,
          expiryDate: null,
        },
        include: {
          category: true,
        },
      });

      expect(result.expiryDate).toBeNull();
    });

    it('should throw BadRequestException when updated category does not exist', async () => {
      const updateProductDto: UpdateProductDto = {
        categoryId: 'missing-category',
      };

      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        productsService.update('prod-1', updateProductDto),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when product to update does not exist', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Name',
      };

      prisma.product.update.mockRejectedValue({
        code: 'P2025',
      });

      await expect(
        productsService.update('missing-product', updateProductDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ConflictException when updated SKU already exists', async () => {
      const updateProductDto: UpdateProductDto = {
        sku: 'DUPLICATE-SKU',
      };

      prisma.product.update.mockRejectedValue({
        code: 'P2002',
      });

      await expect(
        productsService.update('prod-1', updateProductDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete product by id', async () => {
      prisma.product.delete.mockResolvedValue(product);

      const result = await productsService.remove('prod-1');

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: {
          id: 'prod-1',
        },
      });

      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException when product to delete does not exist', async () => {
      prisma.product.delete.mockRejectedValue({
        code: 'P2025',
      });

      await expect(
        productsService.remove('missing-product'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});