import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentStore } from '../common/decorators/current-store.decorator.js';
import { ShelvesService } from './shelves.service.js';
import { CreateShelfDto } from './dto/create-shelf.dto.js';
import { UpdateShelfDto } from './dto/update-shelf.dto.js';
import { AuditReconcileDto } from './dto/audit-reconcile.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('shelves')
export class ShelvesController {
  constructor(private readonly shelvesService: ShelvesService) {}

  @Post()
  create(
    @CurrentStore() storeId: string,
    @Body() createShelfDto: CreateShelfDto,
  ) {
    return this.shelvesService.create(storeId, createShelfDto);
  }

  @Get()
  findAll(@CurrentStore() storeId: string) {
    return this.shelvesService.findAll(storeId);
  }

  @Get(':id')
  findOne(@CurrentStore() storeId: string, @Param('id') id: string) {
    return this.shelvesService.findOne(storeId, id);
  }

  @Patch(':id')
  update(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @Body() updateShelfDto: UpdateShelfDto,
  ) {
    return this.shelvesService.update(storeId, id, updateShelfDto);
  }

  @Delete(':id')
  remove(@CurrentStore() storeId: string, @Param('id') id: string) {
    return this.shelvesService.remove(storeId, id);
  }

  @Post(':id/assign')
  assignProduct(
    @CurrentStore() storeId: string,
    @Param('id') shelfId: string,
    @Body('productId') productId: string,
  ) {
    return this.shelvesService.assignProduct(storeId, shelfId, productId);
  }

  @Post(':id/audit')
  reconcileAudit(
    @CurrentStore() storeId: string,
    @Param('id') shelfId: string,
    @Body() dto: AuditReconcileDto,
  ) {
    return this.shelvesService.reconcileAudit(storeId, shelfId, dto);
  }
}
