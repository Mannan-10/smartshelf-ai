import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { GenerateAutoPODto } from './dto/generate-auto-po.dto.js';
import { StockMovementType } from '../generated/prisma/client.js';

export interface ProductRestockItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  recommendedOrderQty: number;
  unitCost: number;
  totalCost: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  vendorId?: string | null;
  vendorName?: string | null;
}

export interface VendorRestockGroup {
  vendorId: string;
  vendorName: string;
  vendorEmail?: string | null;
  vendorPhone?: string | null;
  items: ProductRestockItem[];
  totalUnits: number;
  totalCost: number;
}

@Injectable()
export class AutoPOService {
  constructor(private readonly prisma: PrismaService) {}

  async getRestockSuggestions(storeId: string) {
    // Find all products where stock is at or below reorderLevel
    const products = await this.prisma.product.findMany({
      where: {
        storeId,
        isArchived: false,
      },
      include: {
        category: true,
      },
      orderBy: { stock: 'asc' },
    });

    const lowStockProducts = products.filter((p) => p.stock <= p.reorderLevel);

    // Fetch past purchase history to map preferred/primary vendors
    const vendorMap = new Map<
      string,
      { id: string; name: string; email?: string | null; phone?: string | null }
    >();
    const allVendors = await this.prisma.vendor.findMany({
      where: { storeId },
    });
    allVendors.forEach((v) => vendorMap.set(v.id, v));

    const suggestions: ProductRestockItem[] = [];

    for (const p of lowStockProducts) {
      // Find latest PO for this product
      const lastPOItem = await this.prisma.purchaseOrderItem.findFirst({
        where: {
          productId: p.id,
          purchaseOrder: { storeId },
        },
        include: {
          purchaseOrder: {
            include: { vendor: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const matchedVendor =
        lastPOItem?.purchaseOrder?.vendor || allVendors[0] || null;

      const targetStock = Math.max(p.reorderLevel * 2, 20);
      const recommendedQty = Math.max(1, targetStock - p.stock);
      const unitCost = p.costPrice
        ? Number(p.costPrice)
        : lastPOItem?.unitCost
          ? Number(lastPOItem.unitCost)
          : p.sellingPrice
            ? Number(p.sellingPrice) * 0.7
            : 10;

      let urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'MEDIUM';
      if (p.stock === 0) {
        urgency = 'CRITICAL';
      } else if (p.stock <= Math.max(1, Math.floor(p.reorderLevel / 2))) {
        urgency = 'HIGH';
      }

      suggestions.push({
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: p.stock,
        reorderLevel: p.reorderLevel,
        recommendedOrderQty: recommendedQty,
        unitCost: Math.round(unitCost * 100) / 100,
        totalCost: Math.round(recommendedQty * unitCost * 100) / 100,
        urgency,
        vendorId: matchedVendor?.id ?? null,
        vendorName: matchedVendor?.name ?? 'Unassigned Vendor',
      });
    }

    // Group items by vendor
    const groupsMap = new Map<string, VendorRestockGroup>();

    for (const item of suggestions) {
      const vId = item.vendorId || 'unassigned';
      const vName = item.vendorName || 'Unassigned Supplier';
      const vendorObj = item.vendorId ? vendorMap.get(item.vendorId) : null;

      if (!groupsMap.has(vId)) {
        groupsMap.set(vId, {
          vendorId: vId,
          vendorName: vName,
          vendorEmail: vendorObj?.email,
          vendorPhone: vendorObj?.phone,
          items: [],
          totalUnits: 0,
          totalCost: 0,
        });
      }

      const grp = groupsMap.get(vId)!;
      grp.items.push(item);
      grp.totalUnits += item.recommendedOrderQty;
      grp.totalCost = Math.round((grp.totalCost + item.totalCost) * 100) / 100;
    }

    const vendorGroups = Array.from(groupsMap.values());
    const totalLowStockItems = suggestions.length;
    const totalEstimatedCost = vendorGroups.reduce(
      (sum, g) => sum + g.totalCost,
      0,
    );

    return {
      totalLowStockItems,
      totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
      vendorGroups,
      allVendors,
    };
  }

  async generateAutoPO(storeId: string, dto: GenerateAutoPODto) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, storeId },
    });
    if (!vendor) {
      throw new NotFoundException(`Vendor not found for this store.`);
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'At least one item is required to generate an Auto-PO.',
      );
    }

    const orderNumber = `AUTO-${Date.now().toString().slice(-6)}`;

    // Verify all products belong to this store
    const productIds = dto.items.map((it) => it.productId);
    const storeProducts = await this.prisma.product.findMany({
      where: { id: { in: productIds }, storeId },
    });

    if (storeProducts.length !== productIds.length) {
      throw new BadRequestException(
        'One or more products do not belong to this store.',
      );
    }

    const totalCost = dto.items.reduce(
      (sum, it) => sum + it.quantity * it.unitCost,
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          storeId,
          vendorId: dto.vendorId,
          orderNumber,
          orderDate: new Date(),
          totalAmount: totalCost,
          notes: dto.notes
            ? `[Auto-PO] ${dto.notes}`
            : `[Auto-PO] Automated restock recommendation for low stock items.`,
        },
      });

      for (const item of dto.items) {
        await tx.purchaseOrderItem.create({
          data: {
            purchaseOrderId: po.id,
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.quantity * item.unitCost,
          },
        });
      }

      return tx.purchaseOrder.findUnique({
        where: { id: po.id },
        include: {
          vendor: true,
          items: {
            include: { product: true },
          },
        },
      });
    });
  }
}
