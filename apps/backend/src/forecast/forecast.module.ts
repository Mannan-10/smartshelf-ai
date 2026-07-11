import { Module } from '@nestjs/common';
import { ForecastService } from './forecast.service.js';
import { ForecastController } from './forecast.controller.js';
import { PrismaModule } from '../prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ForecastController],
  providers: [ForecastService],
})
export class ForecastModule {}