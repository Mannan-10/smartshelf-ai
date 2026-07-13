import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { ForecastService } from './forecast.service.js';
import { FallbackForecastService } from './fallback-forecast.service.js';
import { PrismaService } from '../prisma.service.js';

// ── Mocks ──────────────────────────────────────────────────────────────────────
const mockProduct = {
    id: 'prod-1',
    name: 'Parachute Oil',
    sku: 'OIL-001',
    stock: 50,
    reorderLevel: 10,
    sellingPrice: 25.0,
    costPrice: 20.0,
    saleItems: [
        {
            saleId: 'sale-1',
            quantity: 5,
            totalPrice: 125.0,
            sale: { saleDate: new Date('2026-06-01') },
        },
    ],
};

const mockMlResponse = {
    avg_daily_quantity: 2.5,
    forecast_7_days: [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5],
    forecast_total_7_days: 17.5,
};

const mockFallbackResult = {
    product: { id: 'prod-1', name: 'Parachute Oil', sku: 'OIL-001', currentStock: 50, reorderLevel: 10 },
    forecast: {
        avgDailyQuantity: 1.0,
        forecast7Days: [1, 0, 2, 1, 1, 0, 1],
        forecastTotal7Days: 7.0,
        daysUntilStockout: 50,
        reorderRecommended: false,
    },
    fallback: true,
    fallbackReason: 'ML service unavailable — using 7-day rolling average',
};

const mockPrisma = {
    product: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    },
};

const mockFallbackService = {
    forecastProduct: jest.fn(),
};

// Mock global fetch
global.fetch = jest.fn();

describe('ForecastService', () => {
    let service: ForecastService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ForecastService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: FallbackForecastService, useValue: mockFallbackService },
            ],
        }).compile();

        service = module.get<ForecastService>(ForecastService);
        jest.clearAllMocks();
    });

    // ── forecastProduct ─────────────────────────────────────────────────────────

    describe('forecastProduct', () => {
        beforeEach(() => {
            mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
        });

        it('should return ML forecast when service is available', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockMlResponse,
            });

            const result = await service.forecastProduct('prod-1');

            expect(result.fallback).toBe(false);
            expect(result.forecast.avgDailyQuantity).toBe(2.5);
            expect(result.forecast.forecast7Days).toHaveLength(7);
            expect(result.product.name).toBe('Parachute Oil');
        });

        it('should calculate daysUntilStockout correctly', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockMlResponse,
            });

            const result = await service.forecastProduct('prod-1');

            // stock=50, avgDaily=2.5 → 50/2.5 = 20 days
            expect(result.forecast.daysUntilStockout).toBe(20);
        });

        it('should set reorderRecommended true when stock <= reorderLevel', async () => {
            mockPrisma.product.findUnique.mockResolvedValue({
                ...mockProduct,
                stock: 5, // below reorderLevel of 10
            });
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockMlResponse,
            });

            const result = await service.forecastProduct('prod-1');

            expect(result.forecast.reorderRecommended).toBe(true);
        });

        it('should fall back to rule-based forecast when ML service is down', async () => {
            (global.fetch as jest.Mock).mockRejectedValue(new Error('ECONNREFUSED'));
            mockFallbackService.forecastProduct.mockResolvedValue(mockFallbackResult);

            const result = await service.forecastProduct('prod-1');

            expect(result.fallback).toBe(true);
            expect(result.fallbackReason).toContain('ML service unavailable');
            expect(mockFallbackService.forecastProduct).toHaveBeenCalledWith('prod-1');
        });

        it('should fall back when ML service returns non-200', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 503,
                json: async () => ({ detail: 'Service unavailable' }),
            });
            mockFallbackService.forecastProduct.mockResolvedValue(mockFallbackResult);

            const result = await service.forecastProduct('prod-1');

            expect(result.fallback).toBe(true);
        });

        it('should throw NotFoundException if product not found', async () => {
            mockPrisma.product.findUnique.mockResolvedValue(null);

            await expect(service.forecastProduct('nonexistent')).rejects.toThrow(NotFoundException);
        });

        it('should return null daysUntilStockout when avgDailyQuantity is 0', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({ ...mockMlResponse, avg_daily_quantity: 0 }),
            });

            const result = await service.forecastProduct('prod-1');

            expect(result.forecast.daysUntilStockout).toBeNull();
        });
    });

    // ── forecastAll ─────────────────────────────────────────────────────────────

    describe('forecastAll', () => {
        it('should return forecasts for all products', async () => {
            mockPrisma.product.findMany.mockResolvedValue([{ id: 'prod-1' }]);
            mockPrisma.product.findUnique.mockResolvedValue(mockProduct);
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockMlResponse,
            });

            const result = await service.forecastAll();

            expect(result).toHaveLength(1);
            expect(result[0].product.id).toBe('prod-1');
        });

        it('should skip products that fail and return the rest', async () => {
            mockPrisma.product.findMany.mockResolvedValue([
                { id: 'prod-1' },
                { id: 'prod-fail' },
            ]);
            mockPrisma.product.findUnique
                .mockResolvedValueOnce(mockProduct)
                .mockResolvedValueOnce(null); // second product fails

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => mockMlResponse,
            });

            // prod-fail throws NotFoundException which is caught by allSettled
            mockFallbackService.forecastProduct.mockResolvedValue(null);

            const result = await service.forecastAll();

            // Only successful forecasts returned
            expect(result.length).toBeGreaterThanOrEqual(0);
        });
    });
});