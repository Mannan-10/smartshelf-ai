import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('summary')
  getSummary() {
    return this.alertsService.getAlertsSummary();
  }

  @Get('low-stock')
  getLowStock() {
    return this.alertsService.getLowStockProducts();
  }

  @Get('expiring')
  getExpiring(@Query('days') days?: string) {
    const daysAhead = days ? parseInt(days, 10) : 30;
    return this.alertsService.getExpiringProducts(daysAhead);
  }
}