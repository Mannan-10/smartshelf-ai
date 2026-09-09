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
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentStore } from '../common/decorators/current-store.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentStore() storeId: string,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(storeId, createCategoryDto);
  }

  @Get()
  findAll(@CurrentStore() storeId: string) {
    return this.categoriesService.findAll(storeId);
  }

  @Get(':id')
  findOne(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
  ) {
    return this.categoriesService.findOne(storeId, id);
  }

  @Put(':id')
  update(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(storeId, id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
  ) {
    return this.categoriesService.remove(storeId, id);
  }
}