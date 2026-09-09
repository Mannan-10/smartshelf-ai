import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.js';

function isPrismaError(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === code
  );
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: string, createCategoryDto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          ...createCategoryDto,
          storeId,
        },
      });
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('Category name already exists in this store');
      }

      throw error;
    }
  }

  async findAll(storeId: string) {
    return this.prisma.category.findMany({
      where: { storeId },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  async findOne(storeId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, storeId },
      include: {
        products: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found in this store');
    }

    return category;
  }

  async update(storeId: string, id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(storeId, id);

    try {
      return await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
      });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Category not found');
      }

      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('Category name already exists in this store');
      }

      throw error;
    }
  }

  async remove(storeId: string, id: string) {
    await this.findOne(storeId, id);

    try {
      await this.prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Category not found');
      }

      throw error;
    }
  }
}