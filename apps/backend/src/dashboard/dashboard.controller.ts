import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentStore } from '../common/decorators/current-store.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@CurrentStore() storeId: string) {
    return this.dashboardService.getSummary(storeId);
  }

  @Get('weekly-sales')
  getWeeklyTrend(@CurrentStore() storeId: string) {
    return this.dashboardService.getWeeklySalesTrend(storeId);
  }
}