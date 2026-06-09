import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHello() {
    return {
      message: 'SmartShelf AI Backend is running',
    };
  }

  @Get('health')
  async healthCheck() {
    const productCount = await this.prisma.product.count();

    return {
      status: 'ok',
      database: 'connected',
      products: productCount,
    };
  }
}