import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ForecastService } from './forecast.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Post('product/:id')
  forecastProduct(@Param('id') id: string) {
    return this.forecastService.forecastProduct(id);
  }

  @Get('all')
  forecastAll() {
    return this.forecastService.forecastAll();
  }
}