import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ApplyMarkdownDto } from './dto/apply-markdown.dto.js';
import { StockMovementType } from '../generated/prisma/client.js';

export interface MarkdownRecommendation {
  batchId: string;
  productId: string;
  productName: string;
  sku: string;
  batchQuantity: number;
  expiryDate: string;
  daysToExpiry: number;
  dailySalesVelocity: number;
  projectedDaysToSellOut: number;
  originalPrice: number;
  discountPercentage: number;
  discountedPrice: number;
  revenueAtRisk: number;
  revenueRecovered: number;
  urgency: 'URGENT' | 'HIGH' | 'MEDIUM';
}

@Injectable()
export class DynamicMarkdownService {
  constructor(private readonly prisma: PrismaService) {}

  async getMarkdownRecommendations(storeId: string) {
    const now = new Date();
    const thirtyFiveDaysFromNow = new Date();
    thirtyFiveDaysFromNow.setDate(thirtyFiveDaysFromNow.getDate() + 35);

    // Find expiring batches
    const batches = await this.prisma.productBatch.findMany({
      where: {
        storeId,
        quantity: { gt: 0 },
        expiryDate: {
          not: null,
          lte: thirtyFiveDaysFromNow,
        },
      },
      include: {
        product: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    const recommendations: MarkdownRecommendation[] = [];
    let totalRevenueAtRisk = 0;
    let potentialRevenueSaved = 0;

    // Lookback 14 days for velocity
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    for (const batch of batches) {
      if (!batch.expiryDate || !batch.product) continue;

      const p = batch.product;
      const expiry = new Date(batch.expiryDate);
      const daysToExpiry = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Compute sales velocity
      const salesMovements = await this.prisma.stockMovement.findMany({
        where: {
          productId: p.id,
          storeId,
          type: StockMovementType.SALE,
          createdAt: { gte: fourteenDaysAgo },
        },
      });

      const unitsSold = salesMovements.reduce(
        (sum, m) => sum + Math.abs(m.quantityChange),
        0,
      );
      const dailyVelocity = Math.round((unitsSold / 14) * 100) / 100;
      const projectedDaysToSellOut =
        dailyVelocity > 0 ? Math.ceil(batch.quantity / dailyVelocity) : 999;

      // Determine discount %
      let discountPercentage = 15;
      let urgency: 'URGENT' | 'HIGH' | 'MEDIUM' = 'MEDIUM';

      if (daysToExpiry <= 5) {
        discountPercentage = 40;
        urgency = 'URGENT';
      } else if (daysToExpiry <= 15) {
        discountPercentage = 25;
        urgency = 'HIGH';
      } else {
        discountPercentage = 15;
        urgency = 'MEDIUM';
      }

      const originalPrice = Number(p.sellingPrice) || 0;
      const costPrice = Number(p.costPrice) || 0;

      // Ensure discount does not fall completely below cost price unless urgent
      const rawDiscounted = originalPrice * (1 - discountPercentage / 100);
      const discountedPrice =
        urgency === 'URGENT'
          ? Math.max(1, Math.round(rawDiscounted))
          : Math.max(costPrice, Math.round(rawDiscounted));

      const revenueAtRisk = Math.round(batch.quantity * originalPrice);
      const revenueRecovered = Math.round(batch.quantity * discountedPrice);

      totalRevenueAtRisk += revenueAtRisk;
      potentialRevenueSaved += revenueRecovered;

      recommendations.push({
        batchId: batch.id,
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        batchQuantity: batch.quantity,
        expiryDate: expiry.toISOString(),
        daysToExpiry,
        dailySalesVelocity: dailyVelocity,
        projectedDaysToSellOut,
        originalPrice,
        discountPercentage,
        discountedPrice,
        revenueAtRisk,
        revenueRecovered,
        urgency,
      });
    }

    return {
      totalExpiringBatches: recommendations.length,
      totalRevenueAtRisk: Math.round(totalRevenueAtRisk),
      potentialRevenueSaved: Math.round(potentialRevenueSaved),
      recommendations,
    };
  }

  async applyMarkdown(storeId: string, dto: ApplyMarkdownDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, storeId },
    });

    if (!product) {
      throw new NotFoundException(`Product not found.`);
    }

    const previousPrice = product.sellingPrice;

    const updated = await this.prisma.product.update({
      where: { id: dto.productId },
      data: {
        sellingPrice: dto.discountedPrice,
        description: dto.reason
          ? `${product.description ? product.description + ' ' : ''}[Clearance Promo: ₹${dto.discountedPrice} (was ₹${previousPrice})]`
          : product.description,
      },
      include: {
        category: true,
      },
    });

    return {
      product: updated,
      previousPrice: Number(previousPrice),
      newPrice: dto.discountedPrice,
      appliedAt: new Date(),
    };
  }
}
