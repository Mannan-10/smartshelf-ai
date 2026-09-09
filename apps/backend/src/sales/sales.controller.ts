import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { SalesService } from "./sales.service.js";
import { CreateSaleDto } from "./dto/create-sale.dto.js";
import { CurrentStore } from "../common/decorators/current-store.decorator.js";

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Post()
    create(
        @CurrentStore() storeId: string,
        @Body() createSaleDto: CreateSaleDto,
    ) {
        return this.salesService.create(storeId, createSaleDto);
    }

    @Get()
    findAll(@CurrentStore() storeId: string) {
        return this.salesService.findAll(storeId);
    }

    @Get(':id')
    findOne(
        @CurrentStore() storeId: string,
        @Param('id') id: string,
    ) {
        return this.salesService.findOne(storeId, id);
    }
}