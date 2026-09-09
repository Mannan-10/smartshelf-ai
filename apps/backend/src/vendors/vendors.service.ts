import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateVendorDto } from './dto/create-vendor.dto.js';
import { UpdateVendorDto } from './dto/update-vendor.dto.js';

function isPrismaError(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === code
  );
}

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: string, createVendorDto: CreateVendorDto) {
    return this.prisma.vendor.create({
      data: {
        ...createVendorDto,
        storeId,
      },
    });
  }

  async findAll(storeId: string) {
    return this.prisma.vendor.findMany({
      where: { storeId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(storeId: string, id: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id,
        storeId,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found in this store');
    }

    return vendor;
  }

  async update(storeId: string, id: string, updateVendorDto: UpdateVendorDto) {
    await this.findOne(storeId, id);

    try {
      return await this.prisma.vendor.update({
        where: {
          id,
        },
        data: updateVendorDto,
      });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Vendor not found');
      }

      throw error;
    }
  }

  async remove(storeId: string, id: string) {
    await this.findOne(storeId, id);

    try {
      await this.prisma.vendor.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (isPrismaError(error, 'P2025')) {
        throw new NotFoundException('Vendor not found');
      }

      throw error;
    }
  }
}