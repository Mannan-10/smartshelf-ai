import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

function isPrismaError(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === code
  );
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
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        category: true,
      },
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
      await this.prisma.product.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Product not found');
      }

      throw error;
    }
  }
}