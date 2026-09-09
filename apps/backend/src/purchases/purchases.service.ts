import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { StockMovementType } from '../generated/prisma/client.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';

function isPrismaError(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === code
  );
}

function generateOrderNumber() {
  return `PO-${Date.now()}`;
}

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: string, createPurchaseDto: CreatePurchaseDto) {
    const orderNumber = createPurchaseDto.orderNumber || generateOrderNumber();

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          if (createPurchaseDto.vendorId) {
            const vendor = await tx.vendor.findFirst({
              where: { id: createPurchaseDto.vendorId, storeId },
            });
            if (!vendor) {
              throw new BadRequestException('Vendor does not exist in this store');
            }
          }

          const validatedItems = [];

          for (const item of createPurchaseDto.items) {
            const product = await tx.product.findFirst({
              where: { id: item.productId, storeId },
            });
            if (!product) {
              throw new BadRequestException(
                `Product does not exist in this store: ${item.productId}`,
              );
            }
            validatedItems.push({
              product,
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: item.quantity * item.unitCost,
              expiryDate: item.expiryDate,
            });
          }

          const totalAmount = validatedItems.reduce(
            (sum, item) => sum + item.totalCost,
            0,
          );

          const purchaseOrder = await tx.purchaseOrder.create({
            data: {
              storeId,
              orderNumber,
              vendorId: createPurchaseDto.vendorId,
              orderDate: createPurchaseDto.orderDate
                ? new Date(createPurchaseDto.orderDate)
                : new Date(),
              totalAmount,
              notes: createPurchaseDto.notes,
            },
          });

          for (const item of validatedItems) {
            const purchaseOrderItem = await tx.purchaseOrderItem.create({
              data: {
                purchaseOrderId: purchaseOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                unitCost: item.unitCost,
                totalCost: item.totalCost,
              },
            });

            const stockBefore = item.product.stock;
            const stockAfter = stockBefore + item.quantity;

            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                costPrice: item.unitCost,
                ...(item.expiryDate ? { expiryDate: new Date(item.expiryDate) } : {}),
              },
            });

            await tx.stockMovement.create({
              data: {
                storeId,
                productId: item.productId,
                type: StockMovementType.PURCHASE,
                quantityChange: item.quantity,
                stockBefore,
                stockAfter,
                purchaseOrderId: purchaseOrder.id,
                purchaseOrderItemId: purchaseOrderItem.id,
                note: `Purchase order ${orderNumber}`,
              },
            });

            await tx.productBatch.create({
              data: {
                storeId,
                productId: item.productId,
                purchaseOrderId: purchaseOrder.id,
                quantity: item.quantity,
                unitCost: item.unitCost,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              },
            });
          }

          return tx.purchaseOrder.findUnique({
            where: { id: purchaseOrder.id },
            include: {
              vendor: true,
              items: { include: { product: true } },
              stockMovements: { include: { product: true } },
              batches: true,
            },
          });
        },
        { maxWait: 10000, timeout: 15000 },
      );
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('Purchase order number already exists in this store');
      }
      throw error;
    }
  }

  async findAll(storeId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: true,
        items: { include: { product: true } },
      },
    });
  }

  async findOne(storeId: string, id: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: { id, storeId },
      include: {
        vendor: true,
        items: { include: { product: true } },
        stockMovements: { include: { product: true } },
        batches: true,
      },
    });
    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found in this store');
    }
    return purchaseOrder;
  }
}