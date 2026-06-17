import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module.js';
import { VendorsController } from './vendors.controller.js';
import { VendorsService } from './vendors.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [VendorsController],
  providers: [VendorsService],
})
export class VendorsModule {}