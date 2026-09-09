import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLowStockProducts(storeId: string) {
    const products = await this.prisma.product.findMany({
      where: { storeId, isArchived: false },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        reorderLevel: true,
        category: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
    });

    return products.filter((p) => p.stock <= p.reorderLevel);
  }

  async getExpiringProducts(storeId: string, daysAhead = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    return this.prisma.product.findMany({
      where: {
        storeId,
        isArchived: false,
        expiryDate: {
          not: null,
          lte: cutoff,
        },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        expiryDate: true,
        category: { select: { name: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async getAlertsSummary(storeId: string) {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const [allProducts, expiring, expired] = await Promise.all([
      this.prisma.product.findMany({
        where: { storeId, isArchived: false },
        select: { stock: true, reorderLevel: true },
      }),
      this.prisma.product.count({
        where: {
          storeId,
          isArchived: false,
          expiryDate: { not: null, gte: now, lte: in30Days },
        },
      }),
      this.prisma.product.count({
        where: {
          storeId,
          isArchived: false,
          expiryDate: { not: null, lt: now },
        },
      }),
    ]);

    const lowStock = allProducts.filter((p) => p.stock <= p.reorderLevel).length;

    return { lowStock, expiring, expired };
  }
}