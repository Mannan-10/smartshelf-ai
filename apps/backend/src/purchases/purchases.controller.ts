import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentStore } from '../common/decorators/current-store.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(
    @CurrentStore() storeId: string,
    @Body() createPurchaseDto: CreatePurchaseDto,
  ) {
    return this.purchasesService.create(storeId, createPurchaseDto);
  }

  @Get()
  findAll(@CurrentStore() storeId: string) {
    return this.purchasesService.findAll(storeId);
  }

  @Get(':id')
  findOne(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
  ) {
    return this.purchasesService.findOne(storeId, id);
  }
}