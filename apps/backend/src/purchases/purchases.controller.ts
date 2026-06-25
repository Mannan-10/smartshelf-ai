import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  create(@Body() createPurchaseDto: CreatePurchaseDto) {
    return this.purchasesService.create(createPurchaseDto);
  }

  @Get()
  findAll() {
    return this.purchasesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchasesService.findOne(id);
  }
}