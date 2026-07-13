import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { FallbackForecastService } from './fallback-forecast.service.js';

const ML_SERVICE = process.env.ML_SERVICE_URL ?? 'http://localhost:8000';

@Injectable()
export class ForecastService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fallback: FallbackForecastService,
  ) {}

  async forecastProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        saleItems: {
          include: { sale: { select: { saleDate: true } } },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    // Build feature vector from real product data
    const saleItems = product.saleItems;
    const totalQuantitySold = saleItems.reduce((s, i) => s + i.quantity, 0);
    const totalRevenue      = saleItems.reduce((s, i) => s + Number(i.totalPrice), 0);
    const numOrders         = new Set(saleItems.map((i) => i.saleId)).size;
    const avgUnitPrice      = Number(product.sellingPrice ?? product.costPrice ?? 0);
    const avgQtyPerOrder    = numOrders > 0 ? totalQuantitySold / numOrders : 0;

    const saleDates = saleItems.map((i) => new Date(i.sale.saleDate).getTime());
    const daysActive = saleDates.length > 0
      ? Math.ceil((Date.now() - Math.min(...saleDates)) / (1000 * 60 * 60 * 24)) + 1
      : 1;

    const features = {
      total_quantity_sold:    totalQuantitySold,
      total_revenue:          totalRevenue,
      num_orders:             numOrders,
      avg_unit_price:         avgUnitPrice,
      avg_quantity_per_order: avgQtyPerOrder,
      days_active:            daysActive,
    };

    // Try ML service — fall back gracefully on any error
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const res = await fetch(`${ML_SERVICE}/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) throw new Error(`ML service responded with ${res.status}`);

      const mlResult: {
        avg_daily_quantity: number;
        forecast_7_days: number[];
        forecast_total_7_days: number;
      } = await res.json();

      return {
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: product.stock,
          reorderLevel: product.reorderLevel,
        },
        forecast: {
          avgDailyQuantity:   mlResult.avg_daily_quantity,
          forecast7Days:      mlResult.forecast_7_days,
          forecastTotal7Days: mlResult.forecast_total_7_days,
          daysUntilStockout:  mlResult.avg_daily_quantity > 0
            ? Math.floor(product.stock / mlResult.avg_daily_quantity)
            : null,
          reorderRecommended: product.stock <= product.reorderLevel,
        },
        fallback: false,
        fallbackReason: undefined,
      };

    } catch {
      // ML service is down or timed out — use rule-based fallback
      const fallbackResult = await this.fallback.forecastProduct(productId);
      if (!fallbackResult) throw new NotFoundException('Product not found');
      return fallbackResult;
    }
  }

  async forecastAll() {
    const products = await this.prisma.product.findMany({
      take: 20,
      orderBy: { stock: 'asc' },
      select: { id: true },
    });

    const results = await Promise.allSettled(
      products.map((p) => this.forecastProduct(p.id)),
    );

    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<any>).value);
  }
}