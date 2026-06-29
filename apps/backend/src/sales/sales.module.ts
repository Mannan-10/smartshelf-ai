import { Module } from "@nestjs/common";
import { SalesService } from "./sales.service.js";
import { SalesController } from "./sales.controller.js";
import { PrismaModule } from '../prisma.module.js';

@Module({
    imports: [PrismaModule],
    controllers: [SalesController],
    providers: [SalesService],
})
export class SalesModule {}