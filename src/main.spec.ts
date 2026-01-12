import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { ApiHealthService } from './api/api-health.service';
import { ConfigService } from './config/config.service';
import { bootstrap } from './main';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

jest.mock('./app/app.module', () => ({
  AppModule: class AppModule {},
}));

describe('main bootstrap', () => {
  let mockApp: jest.Mocked<INestApplication>;
  let mockApiHealthService: jest.Mocked<ApiHealthService>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let loggerSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
  };
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    loggerSpy = {
      log: jest.spyOn(Logger.prototype, 'log').mockImplementation(),
      error: jest.spyOn(Logger.prototype, 'error').mockImplementation(),
    };

    processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => {}) as any);

    mockApp = {
      get: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockApiHealthService = {
      checkHealth: jest.fn(),
    } as any;

    mockConfigService = {
      getBotPort: jest.fn().mockReturnValue(3001),
    } as any;

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);

    const serviceMap = new Map([
      [ApiHealthService, mockApiHealthService],
      [ConfigService, mockConfigService],
    ]);
    mockApp.get.mockImplementation((token: any) => {
      return serviceMap.get(token) ?? null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('successful bootstrap', () => {
    it('should perform health check during bootstrap', async () => {
      mockApiHealthService.checkHealth.mockResolvedValue(undefined);
      mockConfigService.getBotPort.mockReturnValue(3001);

      await bootstrap();

      expect(mockApp.get).toHaveBeenCalledWith(ApiHealthService);
      expect(mockApiHealthService.checkHealth).toHaveBeenCalledTimes(1);
    });

    it('should get bot port from ConfigService', async () => {
      mockApiHealthService.checkHealth.mockResolvedValue(undefined);
      mockConfigService.getBotPort.mockReturnValue(8080);

      await bootstrap();

      expect(mockApp.get).toHaveBeenCalledWith(ConfigService);
      expect(mockConfigService.getBotPort).toHaveBeenCalledTimes(1);
    });

    it('should start server on configured port', async () => {
      mockApiHealthService.checkHealth.mockResolvedValue(undefined);
      const port = 8080;
      mockConfigService.getBotPort.mockReturnValue(port);

      await bootstrap();

      expect(mockApp.listen).toHaveBeenCalledWith(port);
      expect(mockApp.listen).toHaveBeenCalledTimes(1);
    });

    it('should log server listening message with port', async () => {
      mockApiHealthService.checkHealth.mockResolvedValue(undefined);
      const port = 3001;
      mockConfigService.getBotPort.mockReturnValue(port);

      await bootstrap();

      expect(loggerSpy.log).toHaveBeenCalledWith(
        `Bot server listening on port ${port}`,
      );
    });

    it('should not exit process on successful bootstrap', async () => {
      mockApiHealthService.checkHealth.mockResolvedValue(undefined);
      mockConfigService.getBotPort.mockReturnValue(3001);

      await bootstrap();

      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should not close app on successful bootstrap', async () => {
      mockApiHealthService.checkHealth.mockResolvedValue(undefined);
      mockConfigService.getBotPort.mockReturnValue(3001);

      await bootstrap();

      expect(mockApp.close).not.toHaveBeenCalled();
    });
  });

  describe('health check failure', () => {
    it('should fail fast when API health check fails', async () => {
      const error = new Error('Connection timeout');
      mockApiHealthService.checkHealth.mockRejectedValue(error);

      await bootstrap();

      expect(mockApiHealthService.checkHealth).toHaveBeenCalled();
      expect(mockApp.listen).not.toHaveBeenCalled();
    });

    it('should log error message when health check fails with Error', async () => {
      const error = new Error('Service unavailable');
      mockApiHealthService.checkHealth.mockRejectedValue(error);

      await bootstrap();

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Failed to start bot: Service unavailable',
      );
      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Bot cannot start without API connection. Please ensure the API is running and accessible.',
      );
    });

    it('should log default error message when health check fails with non-Error', async () => {
      const error = 'API unavailable';
      mockApiHealthService.checkHealth.mockRejectedValue(error);

      await bootstrap();

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Failed to start bot: API health check failed',
      );
    });

    it('should close app when health check fails', async () => {
      const error = new Error('Health check failed');
      mockApiHealthService.checkHealth.mockRejectedValue(error);

      await bootstrap();

      expect(mockApp.close).toHaveBeenCalledTimes(1);
    });

    it('should exit with code 1 when health check fails', async () => {
      const error = new Error('Health check failed');
      mockApiHealthService.checkHealth.mockRejectedValue(error);

      await bootstrap();

      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(processExitSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle app close errors gracefully', async () => {
      const healthCheckError = new Error('Health check failed');
      const closeError = new Error('Close error');
      mockApiHealthService.checkHealth.mockRejectedValue(healthCheckError);
      mockApp.close.mockRejectedValue(closeError);

      await bootstrap();

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Error closing application:',
        closeError,
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should still exit even if app.close throws', async () => {
      const healthCheckError = new Error('Health check failed');
      mockApiHealthService.checkHealth.mockRejectedValue(healthCheckError);
      mockApp.close.mockRejectedValue(new Error('Close failed'));

      await bootstrap();

      // Should still call process.exit even if close throws
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle null error from health check', async () => {
      mockApiHealthService.checkHealth.mockRejectedValue(null);

      await bootstrap();

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Failed to start bot: API health check failed',
      );
      expect(mockApp.close).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle undefined error from health check', async () => {
      mockApiHealthService.checkHealth.mockRejectedValue(undefined);

      await bootstrap();

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Failed to start bot: API health check failed',
      );
      expect(mockApp.close).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should not start server when health check fails', async () => {
      const error = new Error('Health check failed');
      mockApiHealthService.checkHealth.mockRejectedValue(error);

      await bootstrap();

      expect(mockApp.listen).not.toHaveBeenCalled();
      expect(loggerSpy.log).not.toHaveBeenCalledWith(
        expect.stringContaining('listening on port'),
      );
    });
  });

  describe('error handling behavior', () => {
    it('should extract error message correctly from Error instance', async () => {
      const error = new Error('Specific error message');
      mockApiHealthService.checkHealth.mockRejectedValue(error);

      await bootstrap();

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Failed to start bot: Specific error message',
      );
    });

    it('should use default message for non-Error rejection values', async () => {
      const error = { code: 'ECONNREFUSED', status: 503 };
      mockApiHealthService.checkHealth.mockRejectedValue(error);

      await bootstrap();

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Failed to start bot: API health check failed',
      );
    });

    it('should ensure app is closed before exiting on health check failure', async () => {
      const error = new Error('Health check failed');
      mockApiHealthService.checkHealth.mockRejectedValue(error);

      await bootstrap();

      const closeCallOrder = mockApp.close.mock.invocationCallOrder[0];
      const exitCallOrder = processExitSpy.mock.invocationCallOrder[0];

      expect(closeCallOrder).toBeLessThan(exitCallOrder);
    });
  });
});
