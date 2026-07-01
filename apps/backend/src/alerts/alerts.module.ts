import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service.js';
import { AlertsController } from './alerts.controller.js';
import { PrismaModule } from '../prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AlertsController],
  providers: [AlertsService],
})
export class AlertsModule {}