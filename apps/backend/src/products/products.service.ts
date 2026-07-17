import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { AdjustStockDto } from './dto/adjust-stock.dto.js';
import { StockMovementType } from '../generated/prisma/client.js';

function isPrismaError(error: any, code: string) {
  if (typeof error === 'object' && error !== null) {
    if (error.code === code) return true;
    
    // Handle Prisma Neon DriverAdapterError mappings
    if (code === 'P2003' && error.cause && (error.cause.code === '23001' || error.cause.code === '23503')) {
      return true;
    }
    
    // Fallback message check just in case
    if (code === 'P2003' && error.message && error.message.includes('foreign key constraint')) {
      return true;
    }
  }
  return false;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateCategory(categoryId: string | null | undefined) {
    if (categoryId === undefined || categoryId === null) {
      return;
    }

    const category = await this.prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      throw new BadRequestException('Category does not exist');
    }
  }

  async create(createProductDto: CreateProductDto) {
    await this.validateCategory(createProductDto.categoryId);

    try {
      return await this.prisma.product.create({
        data: {
          name: createProductDto.name,
          sku: createProductDto.sku,
          description: createProductDto.description,
          categoryId: createProductDto.categoryId,
          stock: createProductDto.stock,
          reorderLevel: createProductDto.reorderLevel,
          costPrice: createProductDto.costPrice,
          sellingPrice: createProductDto.sellingPrice,
          expiryDate: createProductDto.expiryDate
            ? new Date(createProductDto.expiryDate)
            : undefined,
        },
        include: {
          category: true,
        },
      });
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('Product SKU already exists');
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.product.findMany({
      where: { isArchived: false },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.validateCategory(updateProductDto.categoryId);

    try {
      return await this.prisma.product.update({
        where: {
          id,
        },
        data: {
          name: updateProductDto.name,
          sku: updateProductDto.sku,
          description: updateProductDto.description,
          categoryId: updateProductDto.categoryId,
          stock: updateProductDto.stock,
          reorderLevel: updateProductDto.reorderLevel,
          costPrice: updateProductDto.costPrice,
          sellingPrice: updateProductDto.sellingPrice,
          expiryDate:
            updateProductDto.expiryDate === undefined
              ? undefined
              : updateProductDto.expiryDate
                ? new Date(updateProductDto.expiryDate)
                : null,
        },
        include: {
          category: true,
        },
      });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Product not found');
      }

      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('Product SKU already exists');
      }

      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.product.update({
        where: { id },
        data: { isArchived: true },
      });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Product not found');
      }

      throw error;
    }
  }

  async getBatches(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, sku: true },
    });

    if (!product) throw new NotFoundException('Product not found');

    const batches = await this.prisma.productBatch.findMany({
      where: { productId, quantity: { gt: 0 } },
      include: { purchaseOrder: { select: { orderNumber: true, orderDate: true } } },
      orderBy: [{ expiryDate: 'asc'}, { receivedAt: 'asc' }],
    });

    return { product, batches };
  }

  async adjustStock(id: string, adjustStockDto: AdjustStockDto) {
    const { quantityChange, note } = adjustStockDto;
    if (quantityChange === 0) {
      throw new BadRequestException('Quantity change cannot be zero');
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.stock + quantityChange < 0) {
        throw new BadRequestException('Adjustment would result in negative stock');
      }

      const stockBefore = product.stock;
      const stockAfter = stockBefore + quantityChange;

      const updatedProduct = await tx.product.update({
        where: { id },
        data: { stock: stockAfter },
      });

      await tx.stockMovement.create({
        data: {
          productId: id,
          type: StockMovementType.ADJUSTMENT,
          quantityChange,
          stockBefore,
          stockAfter,
          note,
        },
      });

      // Simple handling for batches on adjustment:
      // We don't adjust specific batches here to keep it simple, 
      // but in a fully-fledged ERP you would select which batch to adjust.
      // We assume adjustments do not affect existing purchase batches directly for this MVP.

      return updatedProduct;
    });
  }
}