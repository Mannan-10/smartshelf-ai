import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(storeId: string) {
    let store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      store = await this.prisma.store.create({
        data: {
          id: storeId,
          name: 'My Shop',
          currency: 'INR',
        },
      });
    }

    return {
      id: store.id,
      shopName: store.name,
      currency: store.currency,
      contactEmail: store.contactEmail,
      address: store.address,
    };
  }

  async updateSettings(storeId: string, dto: UpdateSettingsDto) {
    const updated = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        ...(dto.shopName ? { name: dto.shopName } : {}),
        ...(dto.currency ? { currency: dto.currency } : {}),
        ...(dto.contactEmail !== undefined ? { contactEmail: dto.contactEmail } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
      },
    });

    return {
      id: updated.id,
      shopName: updated.name,
      currency: updated.currency,
      contactEmail: updated.contactEmail,
      address: updated.address,
    };
  }
}
