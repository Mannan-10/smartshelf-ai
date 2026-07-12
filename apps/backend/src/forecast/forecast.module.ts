import { Module } from '@nestjs/common';
import { ForecastService } from './forecast.service.js';
import { ForecastController } from './forecast.controller.js';
import { PrismaModule } from '../prisma.module.js';
import { FallbackForecastService } from './fallback-forecast.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ForecastController],
  providers: [ForecastService, FallbackForecastService],
})
export class ForecastModule {}