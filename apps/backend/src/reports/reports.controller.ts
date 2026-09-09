import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentStore } from '../common/decorators/current-store.decorator.js';

function csvResponse(res: Response, filename: string, csv: string) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
}

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('sales')
    async getSalesCsv(
        @CurrentStore() storeId: string,
        @Res() res: Response,
    ) {
        const csv = await this.reportsService.generateSalesCsv(storeId);
        const date = new Date().toISOString().slice(0, 10);
        csvResponse(res, `sales-report-${date}.csv`, csv);
    }

    @Get('inventory')
    async getInventoryCsv(
        @CurrentStore() storeId: string,
        @Res() res: Response,
    ) {
        const csv = await this.reportsService.generateInventoryCsv(storeId);
        const date = new Date().toISOString().slice(0, 10);
        csvResponse(res, `inventory-report-${date}.csv`, csv);
    }
}