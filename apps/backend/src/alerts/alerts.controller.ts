import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentStore } from '../common/decorators/current-store.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('summary')
  getSummary(@CurrentStore() storeId: string) {
    return this.alertsService.getAlertsSummary(storeId);
  }

  @Get('low-stock')
  getLowStock(@CurrentStore() storeId: string) {
    return this.alertsService.getLowStockProducts(storeId);
  }

  @Get('expiring')
  getExpiring(
    @CurrentStore() storeId: string,
    @Query('days') days?: string,
  ) {
    const daysAhead = days ? parseInt(days, 10) : 30;
    return this.alertsService.getExpiringProducts(storeId, daysAhead);
  }
}