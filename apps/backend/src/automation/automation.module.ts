import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller.js';
import { AutoPOService } from './auto-po.service.js';
import { DynamicMarkdownService } from './dynamic-markdown.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  controllers: [AutomationController],
  providers: [AutoPOService, DynamicMarkdownService, PrismaService],
  exports: [AutoPOService, DynamicMarkdownService],
})
export class AutomationModule {}
