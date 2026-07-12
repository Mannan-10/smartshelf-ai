import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { StockMovementType } from '../generated/prisma/client.js';

@Injectable()
export class FallbackForecastService {
  constructor(private readonly prisma: PrismaService) {}

  async forecastProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        reorderLevel: true,
      },
    });

    if (!product) return null;

    // Get last 7 days of SALE stock movements for this product
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const movements = await this.prisma.stockMovement.findMany({
      where: {
        productId,
        type: StockMovementType.SALE,
        createdAt: { gte: since },
      },
      select: {
        quantityChange: true,
        createdAt: true,
      },
    });

    // Group quantity sold by day
    const dailyMap: Record<string, number> = {};
    for (const m of movements) {
      const day = m.createdAt.toISOString().slice(0, 10);
      dailyMap[day] = (dailyMap[day] ?? 0) + Math.abs(m.quantityChange);
    }

    // Fill all 7 days (including days with 0 sales)
    const dailyQtys: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyQtys.push(dailyMap[key] ?? 0);
    }

    const avgDailyQuantity =
      dailyQtys.reduce((s, q) => s + q, 0) / dailyQtys.length;

    const forecastTotal7Days = parseFloat((avgDailyQuantity * 7).toFixed(2));
    const forecast7Days = dailyQtys.map((q) => parseFloat(q.toFixed(2)));

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.stock,
        reorderLevel: product.reorderLevel,
      },
      forecast: {
        avgDailyQuantity: parseFloat(avgDailyQuantity.toFixed(2)),
        forecast7Days,
        forecastTotal7Days,
        daysUntilStockout:
          avgDailyQuantity > 0
            ? Math.floor(product.stock / avgDailyQuantity)
            : null,
        reorderRecommended: product.stock <= product.reorderLevel,
      },
      fallback: true,
      fallbackReason: 'ML service unavailable — using 7-day rolling average',
    };
  }
}