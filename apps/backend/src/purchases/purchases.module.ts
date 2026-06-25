import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module.js';
import { PurchasesController } from './purchases.controller.js';
import { PurchasesService } from './purchases.service.js';

@Module({
    imports: [PrismaModule],
    controllers: [PurchasesController],
    providers: [PurchasesService],
})
export class PurchasesModule { }