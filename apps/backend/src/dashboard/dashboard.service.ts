import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
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
      topProducts,
      recentSales,
    ] = await Promise.all([
      // Total product count
      this.prisma.product.count(),

      // All products to calculate low stock (column-to-column comparison)
      this.prisma.product.findMany({
        select: { stock: true, reorderLevel: true },
      }),

      // Expiring within 30 days
      this.prisma.product.count({
        where: {
          expiryDate: { not: null, gte: now, lte: in30Days },
        },
      }),

      // Total sales count + revenue (all time)
      this.prisma.sale.aggregate({
        _count: { id: true },
        _sum: { totalAmount: true },
      }),

      // This month's sales count + revenue
      this.prisma.sale.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),

      // Top 5 products by quantity sold
      this.prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),

      // 5 most recent sales
      this.prisma.sale.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          items: { include: { product: { select: { name: true } } } },
        },
      }),
    ]);

    const lowStockCount = allProducts.filter((p) => p.stock <= p.reorderLevel).length;

    // Hydrate top products with product names
    const productIds = topProducts.map((t) => t.productId);
    const productNames = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });
    const nameMap = Object.fromEntries(productNames.map((p) => [p.id, p]));

    const topProductsHydrated = topProducts.map((t) => ({
      productId: t.productId,
      name: nameMap[t.productId]?.name ?? 'Unknown',
      sku: nameMap[t.productId]?.sku ?? '',
      totalQuantitySold: t._sum.quantity ?? 0,
      totalRevenue: t._sum.totalPrice ?? 0,
    }));

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

  async getWeeklySalesTrend() {
    // Get last 8 weeks of daily sales data
    const since = new Date();
    since.setDate(since.getDate() - 56); // 8 weeks back

    const sales = await this.prisma.sale.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, totalAmount: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by week (ISO week string: "2026-W01")
    const weekMap: Record<string, { week: string; revenue: number; count: number }> = {};

    for (const sale of sales) {
      const date = new Date(sale.createdAt);
      // Get Monday of that week
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      const weekKey = monday.toISOString().slice(0, 10); // "2026-06-29"

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { week: weekKey, revenue: 0, count: 0 };
      }
      weekMap[weekKey].revenue += Number(sale.totalAmount);
      weekMap[weekKey].count += 1;
    }

    return Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week));
  }
}