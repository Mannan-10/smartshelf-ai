import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentStore } from '../common/decorators/current-store.decorator.js';
import { AutoPOService } from './auto-po.service.js';
import { DynamicMarkdownService } from './dynamic-markdown.service.js';
import { GenerateAutoPODto } from './dto/generate-auto-po.dto.js';
import { ApplyMarkdownDto } from './dto/apply-markdown.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('automation')
export class AutomationController {
  constructor(
    private readonly autoPOService: AutoPOService,
    private readonly markdownService: DynamicMarkdownService,
  ) {}

  @Get('restock-suggestions')
  getRestockSuggestions(@CurrentStore() storeId: string) {
    return this.autoPOService.getRestockSuggestions(storeId);
  }

  @Post('generate-auto-po')
  generateAutoPO(
    @CurrentStore() storeId: string,
    @Body() dto: GenerateAutoPODto,
  ) {
    return this.autoPOService.generateAutoPO(storeId, dto);
  }

  @Get('markdown-recommendations')
  getMarkdownRecommendations(@CurrentStore() storeId: string) {
    return this.markdownService.getMarkdownRecommendations(storeId);
  }

  @Post('apply-markdown')
  applyMarkdown(
    @CurrentStore() storeId: string,
    @Body() dto: ApplyMarkdownDto,
  ) {
    return this.markdownService.applyMarkdown(storeId, dto);
  }
}
