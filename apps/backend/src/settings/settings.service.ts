import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.shopSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.shopSettings.create({
        data: {
          shopName: 'My Shop',
          currency: 'USD',
        },
      });
    }
    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const settings = await this.getSettings();
    return this.prisma.shopSettings.update({
      where: { id: settings.id },
      data: dto,
    });
  }
}
