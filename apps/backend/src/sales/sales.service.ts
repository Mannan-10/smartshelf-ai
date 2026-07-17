import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { StockMovementType } from '../generated/prisma/client.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';

function isPrismaError(error: unknown, code: string) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === code
  );
}

function generateInvoiceNumber() {
  return `INV-${Date.now()}`;
}

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto) {
    const invoiceNumber = createSaleDto.invoiceNumber || generateInvoiceNumber();

    try {
      return await this.prisma.$transaction(async (tx) => {
        const validatedItems = [];

        for (const item of createSaleDto.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new BadRequestException(`Product does not exist: ${item.productId}`);
          }

          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
            );
          }

          validatedItems.push({
            product,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          });
        }

        const totalAmount = validatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

        const sale = await tx.sale.create({
          data: {
            invoiceNumber,
            saleDate: createSaleDto.saleDate ? new Date(createSaleDto.saleDate) : new Date(),
            totalAmount,
            notes: createSaleDto.notes,
          },
        });

        for (const item of validatedItems) {
          const saleItem = await tx.saleItem.create({
            data: {
              saleId: sale.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            },
          });

          const stockBefore = item.product.stock;
          const stockAfter = stockBefore - item.quantity;

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: StockMovementType.SALE,
              quantityChange: -item.quantity,
              stockBefore,
              stockAfter,
              saleId: sale.id,
              saleItemId: saleItem.id,
              note: `Sale invoice ${invoiceNumber}`,
            },
          });

          // FEFO batch deduction: deduct from soonest-expiring batch first
          const batches = await tx.productBatch.findMany({
            where: { productId: item.productId, quantity: { gt: 0 } },
            orderBy: [{ expiryDate: 'asc' }, { receivedAt: 'asc' }],
          });

          let remaining = item.quantity;
          for (const batch of batches) {
            if (remaining <= 0) break;
            const deduct = Math.min(batch.quantity, remaining);
            remaining -= deduct;
            await tx.productBatch.update({
              where: { id: batch.id },
              data: { quantity: { decrement: deduct } },
            });
          }
        }

        return tx.sale.findUnique({
          where: { id: sale.id },
          include: {
            items: { include: { product: true } },
            stockMovements: { include: { product: true } },
          },
        });
      }, {
        maxWait: 15000,
        timeout: 25000,
      });
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('Invoice number already exists');
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    });
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        stockMovements: { include: { product: true } },
      },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }
}