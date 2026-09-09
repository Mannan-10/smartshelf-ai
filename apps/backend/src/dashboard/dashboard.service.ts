import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(storeId: string) {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProducts,
      allProducts,
      expiringCount,
      totalSales,
      monthlySales,
      recentSales,
      saleItems,
    ] = await Promise.all([
      // Total product count in this store
      this.prisma.product.count({
        where: { storeId, isArchived: false },
      }),

      // Products to calculate low stock
      this.prisma.product.findMany({
        where: { storeId, isArchived: false },
        select: { stock: true, reorderLevel: true },
      }),

      // Expiring within 30 days in this store
      this.prisma.product.count({
        where: {
          storeId,
          isArchived: false,
          expiryDate: { not: null, gte: now, lte: in30Days },
        },
      }),

      // Total sales count + revenue (all time) in this store
      this.prisma.sale.aggregate({
        where: { storeId },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),

      // This month's sales count + revenue in this store
      this.prisma.sale.aggregate({
        where: { storeId, createdAt: { gte: startOfMonth } },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),

      // 5 most recent sales in this store
      this.prisma.sale.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          items: { include: { product: { select: { name: true } } } },
        },
      }),

      // Sale items in this store to calculate top products
      this.prisma.saleItem.findMany({
        where: { sale: { storeId } },
        select: {
          productId: true,
          quantity: true,
          totalPrice: true,
          product: { select: { id: true, name: true, sku: true } },
        },
      }),
    ]);

    const lowStockCount = allProducts.filter((p) => p.stock <= p.reorderLevel).length;

    // Aggregate top products in memory (safe and relation-filtered)
    const productSalesMap = new Map<string, { productId: string; name: string; sku: string; totalQuantitySold: number; totalRevenue: number }>();

    for (const item of saleItems) {
      const existing = productSalesMap.get(item.productId) || {
        productId: item.productId,
        name: item.product?.name ?? 'Unknown',
        sku: item.product?.sku ?? '',
        totalQuantitySold: 0,
        totalRevenue: 0,
      };
      existing.totalQuantitySold += item.quantity;
      existing.totalRevenue += item.totalPrice;
      productSalesMap.set(item.productId, existing);
    }

    const topProductsHydrated = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
      .slice(0, 5);

    return {
      products: {
        total: totalProducts,
        lowStock: lowStockCount,
        expiring: expiringCount,
      },
      sales: {
        allTime: {
          count: totalSales._count.id,
          revenue: totalSales._sum.totalAmount ?? 0,
        },
        thisMonth: {
          count: monthlySales._count.id,
          revenue: monthlySales._sum.totalAmount ?? 0,
        },
      },
      topProducts: topProductsHydrated,
      recentSales,
    };
  }

  async getWeeklySalesTrend(storeId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 56); // 8 weeks back

    const sales = await this.prisma.sale.findMany({
      where: { storeId, createdAt: { gte: since } },
      select: { createdAt: true, totalAmount: true },
      orderBy: { createdAt: 'asc' },
    });

    const weekMap: Record<string, { week: string; revenue: number; count: number }> = {};

    for (const sale of sales) {
      const date = new Date(sale.createdAt);
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      const weekKey = monday.toISOString().slice(0, 10);

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { week: weekKey, revenue: 0, count: 0 };
      }
      weekMap[weekKey].revenue += Number(sale.totalAmount);
      weekMap[weekKey].count += 1;
    }

    return Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week));
  }
}