import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ForecastService } from './forecast.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentStore } from '../common/decorators/current-store.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Post('product/:id')
  forecastProduct(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
  ) {
    return this.forecastService.forecastProduct(storeId, id);
  }

  @Get('all')
  forecastAll(@CurrentStore() storeId: string) {
    return this.forecastService.forecastAll(storeId);
  }
}