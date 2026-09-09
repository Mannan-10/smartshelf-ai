import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { AdjustStockDto } from './dto/adjust-stock.dto.js';
import { CurrentStore } from '../common/decorators/current-store.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentStore() storeId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(storeId, createProductDto);
  }

  @Get()
  findAll(@CurrentStore() storeId: string) {
    return this.productsService.findAll(storeId);
  }

  @Get(':id')
  findOne(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.findOne(storeId, id);
  }

  @Put(':id')
  update(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(storeId, id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.remove(storeId, id);
  }

  @Get(':id/batches')
  getBatches(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.getBatches(storeId, id);
  }

  @Post(':id/adjust')
  adjustStock(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @Body() adjustStockDto: AdjustStockDto,
  ) {
    return this.productsService.adjustStock(storeId, id, adjustStockDto);
  }
}