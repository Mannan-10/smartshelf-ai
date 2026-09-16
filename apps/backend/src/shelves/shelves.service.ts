import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateShelfDto } from './dto/create-shelf.dto.js';
import { UpdateShelfDto } from './dto/update-shelf.dto.js';
import { AuditReconcileDto } from './dto/audit-reconcile.dto.js';
import { StockMovementType } from '../generated/prisma/client.js';

export interface ShelfHealthSummary {
  currentStock: number;
  occupancyPercentage: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  expiredBatchCount: number;
  expiringSoonBatchCount: number;
}

@Injectable()
export class ShelvesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateCode(dto: CreateShelfDto): string {
    if (dto.code && dto.code.trim()) {
      return dto.code.trim().toUpperCase();
    }
    const clean = (val: string) =>
      val
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 4);

    const a = clean(dto.aisle) || 'A1';
    const r = clean(dto.rack) || 'R1';
    const s = clean(dto.shelf) || 'S1';
    const b = dto.bin ? `-${clean(dto.bin)}` : '';
    return `${a}-${r}-${s}${b}`;
  }

  private computeShelfHealth(
    capacity: number,
    products: { stock: number }[],
    batches: { quantity: number; expiryDate: Date | null }[],
  ): ShelfHealthSummary {
    const currentStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
    const occupancyPercentage =
      capacity > 0
        ? Math.min(100, Math.round((currentStock / capacity) * 100))
        : 0;

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let expiredBatchCount = 0;
    let expiringSoonBatchCount = 0;

    for (const b of batches) {
      if (b.expiryDate && b.quantity > 0) {
        const exp = new Date(b.expiryDate);
        if (exp < now) {
          expiredBatchCount++;
        } else if (exp <= thirtyDaysFromNow) {
          expiringSoonBatchCount++;
        }
      }
    }

    let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
    if (currentStock === 0 || expiredBatchCount > 0) {
      status = 'CRITICAL';
    } else if (occupancyPercentage < 20 || expiringSoonBatchCount > 0) {
      status = 'WARNING';
    }

    return {
      currentStock,
      occupancyPercentage,
      status,
      expiredBatchCount,
      expiringSoonBatchCount,
    };
  }

  async create(storeId: string, dto: CreateShelfDto) {
    const code = this.generateCode(dto);

    const existing = await this.prisma.shelfLocation.findFirst({
      where: { storeId, code },
    });
    if (existing) {
      throw new ConflictException(
        `Shelf with code "${code}" already exists in this store.`,
      );
    }

    return this.prisma.shelfLocation.create({
      data: {
        storeId,
        code,
        aisle: dto.aisle,
        rack: dto.rack,
        shelf: dto.shelf,
        bin: dto.bin,
        capacity: dto.capacity || 100,
        notes: dto.notes,
      },
    });
  }

  async findAll(storeId: string) {
    const shelves = await this.prisma.shelfLocation.findMany({
      where: { storeId },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            sellingPrice: true,
            reorderLevel: true,
          },
        },
        productBatches: {
          where: { quantity: { gt: 0 } },
          select: {
            id: true,
            quantity: true,
            expiryDate: true,
          },
        },
      },
      orderBy: [{ aisle: 'asc' }, { rack: 'asc' }, { shelf: 'asc' }],
    });

    return shelves.map((s) => {
      const health = this.computeShelfHealth(
        s.capacity,
        s.products,
        s.productBatches,
      );
      return {
        ...s,
        ...health,
      };
    });
  }

  async findOne(storeId: string, id: string) {
    const shelf = await this.prisma.shelfLocation.findFirst({
      where: { id, storeId },
      include: {
        products: {
          include: {
            category: true,
            batches: {
              where: { quantity: { gt: 0 } },
              orderBy: { expiryDate: 'asc' },
            },
          },
        },
        productBatches: {
          where: { quantity: { gt: 0 } },
          include: {
            product: true,
          },
          orderBy: { expiryDate: 'asc' },
        },
      },
    });

    if (!shelf) {
      throw new NotFoundException(`Shelf location with ID "${id}" not found.`);
    }

    const health = this.computeShelfHealth(
      shelf.capacity,
      shelf.products,
      shelf.productBatches,
    );
    return {
      ...shelf,
      ...health,
    };
  }

  async update(storeId: string, id: string, dto: UpdateShelfDto) {
    const shelf = await this.prisma.shelfLocation.findFirst({
      where: { id, storeId },
    });
    if (!shelf) {
      throw new NotFoundException(`Shelf location not found.`);
    }

    if (dto.code && dto.code.trim().toUpperCase() !== shelf.code) {
      const newCode = dto.code.trim().toUpperCase();
      const existing = await this.prisma.shelfLocation.findFirst({
        where: { storeId, code: newCode, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(
          `Shelf with code "${newCode}" already exists.`,
        );
      }
    }

    return this.prisma.shelfLocation.update({
      where: { id },
      data: {
        ...(dto.code && { code: dto.code.trim().toUpperCase() }),
        ...(dto.aisle !== undefined && { aisle: dto.aisle }),
        ...(dto.rack !== undefined && { rack: dto.rack }),
        ...(dto.shelf !== undefined && { shelf: dto.shelf }),
        ...(dto.bin !== undefined && { bin: dto.bin }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(storeId: string, id: string) {
    const shelf = await this.prisma.shelfLocation.findFirst({
      where: { id, storeId },
    });
    if (!shelf) {
      throw new NotFoundException(`Shelf location not found.`);
    }

    // Unassign products and batches from this shelf
    await this.prisma.product.updateMany({
      where: { shelfLocationId: id },
      data: { shelfLocationId: null },
    });
    await this.prisma.productBatch.updateMany({
      where: { shelfLocationId: id },
      data: { shelfLocationId: null },
    });

    return this.prisma.shelfLocation.delete({
      where: { id },
    });
  }

  async assignProduct(storeId: string, shelfId: string, productId: string) {
    const shelf = await this.prisma.shelfLocation.findFirst({
      where: { id: shelfId, storeId },
    });
    if (!shelf) {
      throw new NotFoundException(`Shelf location not found.`);
    }

    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
    });
    if (!product) {
      throw new NotFoundException(`Product not found.`);
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { shelfLocationId: shelfId },
    });
  }

  async reconcileAudit(
    storeId: string,
    shelfId: string,
    dto: AuditReconcileDto,
  ) {
    const shelf = await this.prisma.shelfLocation.findFirst({
      where: { id: shelfId, storeId },
    });
    if (!shelf) {
      throw new NotFoundException(`Shelf location not found.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const results = [];
      let totalAdjusted = 0;
      let totalVariance = 0;

      for (const item of dto.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, storeId },
        });
        if (!product) continue;

        const stockBefore = product.stock;
        const counted = Math.max(0, item.countedQuantity);
        const variance = counted - stockBefore;

        if (variance !== 0) {
          totalAdjusted++;
          totalVariance += variance;

          // Update stock level
          await tx.product.update({
            where: { id: product.id },
            data: { stock: counted },
          });

          // Record adjustment movement
          await tx.stockMovement.create({
            data: {
              storeId,
              productId: product.id,
              type: StockMovementType.ADJUSTMENT,
              quantityChange: variance,
              stockBefore,
              stockAfter: counted,
              note: `Cycle count audit on shelf ${shelf.code}: counted ${counted} (Variance: ${variance > 0 ? '+' : ''}${variance}). ${item.notes || dto.notes || ''}`.trim(),
            },
          });
        }

        results.push({
          productId: product.id,
          productName: product.name,
          stockBefore,
          countedQuantity: counted,
          variance,
        });
      }

      return {
        shelfId,
        shelfCode: shelf.code,
        totalItemsCounted: dto.items.length,
        itemsAdjustedCount: totalAdjusted,
        netVariance: totalVariance,
        auditedAt: new Date(),
        details: results,
      };
    });
  }
}
