import { Module } from '@nestjs/common';
import { ShelvesService } from './shelves.service.js';
import { ShelvesController } from './shelves.controller.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [ShelvesController],
  providers: [ShelvesService, PrismaService],
  exports: [ShelvesService],
})
export class ShelvesModule {}
