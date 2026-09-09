import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(fields: (string | number | null | undefined)[]): string {
  return fields.map(escapeCsv).join(',');
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateSalesCsv(storeId: string): Promise<string> {
    const sales = await this.prisma.sale.findMany({
      where: { storeId },
      orderBy: { saleDate: 'desc' },
      include: {
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    });

    const lines: string[] = [];

    lines.push(row([
      'Invoice Number',
      'Sale Date',
      'Product Name',
      'SKU',
      'Quantity',
      'Unit Price (₹)',
      'Line Total (₹)',
      'Invoice Total (₹)',
      'Notes',
    ]));

    for (const sale of sales) {
      for (const item of sale.items) {
        lines.push(row([
          sale.invoiceNumber,
          formatDate(sale.saleDate),
          item.product.name,
          item.product.sku,
          item.quantity,
          Number(item.unitPrice).toFixed(2),
          Number(item.totalPrice).toFixed(2),
          Number(sale.totalAmount).toFixed(2),
          sale.notes ?? '',
        ]));
      }
    }

    return lines.join('\n');
  }

  async generateInventoryCsv(storeId: string): Promise<string> {
    const products = await this.prisma.product.findMany({
      where: { storeId, isArchived: false },
      orderBy: { name: 'asc' },
      include: { category: true },
    });

    const lines: string[] = [];

    lines.push(row([
      'Name',
      'SKU',
      'Category',
      'Stock',
      'Reorder Level',
      'Status',
      'Cost Price (₹)',
      'Selling Price (₹)',
      'Expiry Date',
    ]));

    for (const p of products) {
      const isLowStock = p.stock <= p.reorderLevel;
      const status = p.stock === 0
        ? 'Out of stock'
        : isLowStock
        ? 'Low stock'
        : 'In stock';

      lines.push(row([
        p.name,
        p.sku,
        p.category?.name ?? 'Uncategorised',
        p.stock,
        p.reorderLevel,
        status,
        p.costPrice ? Number(p.costPrice).toFixed(2) : '',
        p.sellingPrice ? Number(p.sellingPrice).toFixed(2) : '',
        formatDate(p.expiryDate),
      ]));
    }

    return lines.join('\n');
  }
}