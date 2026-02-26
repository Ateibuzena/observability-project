import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { MetricsService } from './observability/metrics/metrics.service';

describe('AppController', () => {
  let appController: AppController;

  const metricsServiceMock = {
    getMetrics: jest.fn().mockResolvedValue('test_metric 1'),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: MetricsService,
          useValue: metricsServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('test', () => {
    it('should return API health payload', () => {
      expect(appController.test()).toEqual({ message: 'ok' });
    });
  });
});
