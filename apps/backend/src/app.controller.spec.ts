import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { AppController } from './app.controller.js';
import { PrismaService } from './prisma.service.js';

describe('AppController', () => {
  let appController: AppController;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      product: {
        count: jest.fn().mockResolvedValue(10),
      },
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return backend running message', () => {
      expect(appController.getHello()).toEqual({
        message: 'SmartShelf AI Backend is running',
      });
    });
  });

  describe('health', () => {
    it('should return status ok and product count', async () => {
      const result = await appController.healthCheck();
      expect(result).toEqual({
        status: 'ok',
        database: 'connected',
        products: 10,
      });
      expect(mockPrisma.product.count).toHaveBeenCalled();
    });
  });
});
