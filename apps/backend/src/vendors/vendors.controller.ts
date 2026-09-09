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
import { VendorsService } from './vendors.service.js';
import { CreateVendorDto } from './dto/create-vendor.dto.js';
import { UpdateVendorDto } from './dto/update-vendor.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentStore } from '../common/decorators/current-store.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentStore() storeId: string,
    @Body() createVendorDto: CreateVendorDto,
  ) {
    return this.vendorsService.create(storeId, createVendorDto);
  }

  @Get()
  findAll(@CurrentStore() storeId: string) {
    return this.vendorsService.findAll(storeId);
  }

  @Get(':id')
  findOne(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
  ) {
    return this.vendorsService.findOne(storeId, id);
  }

  @Put(':id')
  update(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ) {
    return this.vendorsService.update(storeId, id, updateVendorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
  ) {
    return this.vendorsService.remove(storeId, id);
  }
}