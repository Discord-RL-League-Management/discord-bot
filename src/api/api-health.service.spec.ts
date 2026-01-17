import { Test, TestingModule } from '@nestjs/testing';
import { ApiHealthService } from './api-health.service';
import { ApiService } from './api.service';
import { AppLogger } from '../common/app-logger.service';

describe('ApiHealthService', () => {
  let service: ApiHealthService;
  let apiService: jest.Mocked<ApiService>;
  let module: TestingModule;
  let loggerSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const mockApiService = {
      healthCheck: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        ApiHealthService,
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
        {
          provide: ApiService,
          useValue: mockApiService,
        },
      ],
    }).compile();

    service = module.get<ApiHealthService>(ApiHealthService);
    apiService = module.get(ApiService);

    loggerSpy = {
      log: jest.spyOn(mockLogger, 'log'),
      error: jest.spyOn(mockLogger, 'error'),
    };

    jest.clearAllMocks();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should successfully check API health and log success message', async () => {
      const mockHealthResponse = {
        status: 'ok',
        version: '1.0.0',
      };

      apiService.healthCheck.mockResolvedValue(mockHealthResponse);

      await service.checkHealth();

      expect(apiService.healthCheck).toHaveBeenCalledTimes(1);
      expect(loggerSpy.log).toHaveBeenCalledWith('Checking API health...');
      expect(loggerSpy.log).toHaveBeenCalledWith('API health check passed');
      expect(loggerSpy.log).toHaveBeenCalledTimes(2);
      expect(loggerSpy.error).not.toHaveBeenCalled();
    });

    it('should throw descriptive error when API health check fails with Error', async () => {
      const errorMessage = 'Connection timeout';
      const error = new Error(errorMessage);

      apiService.healthCheck.mockRejectedValue(error);

      const thrownError = await service.checkHealth().catch((e) => e as Error);
      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(
        'API health check failed: Connection timeout. Bot cannot start without API connection.',
      );

      expect(apiService.healthCheck).toHaveBeenCalled();
      expect(loggerSpy.log).toHaveBeenCalledWith('Checking API health...');
      expect(loggerSpy.error).toHaveBeenCalledWith(
        'API health check failed:',
        error,
      );
    });

    it('should throw descriptive error when API health check fails with ApiError', async () => {
      // Create a real Error instance since ApiHealthService checks instanceof Error
      const apiError = new Error('Service unavailable');

      apiService.healthCheck.mockRejectedValue(apiError);

      const thrownError = await service.checkHealth().catch((e) => e as Error);
      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(
        'API health check failed: Service unavailable. Bot cannot start without API connection.',
      );

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'API health check failed:',
        apiError,
      );
    });

    it('should handle non-Error rejection values and throw descriptive error', async () => {
      const errorValue = 'API unavailable';

      apiService.healthCheck.mockRejectedValue(errorValue);

      const thrownError = await service.checkHealth().catch((e) => e as Error);
      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(
        'API health check failed: API unavailable. Bot cannot start without API connection.',
      );

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'API health check failed:',
        errorValue,
      );
    });

    it('should handle null rejection values gracefully', async () => {
      apiService.healthCheck.mockRejectedValue(null);

      const thrownError = await service.checkHealth().catch((e) => e as Error);
      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(
        'API health check failed: API unavailable. Bot cannot start without API connection.',
      );

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'API health check failed:',
        null,
      );
    });

    it('should handle undefined rejection values gracefully', async () => {
      apiService.healthCheck.mockRejectedValue(undefined);

      const thrownError = await service.checkHealth().catch((e) => e as Error);
      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(
        'API health check failed: API unavailable. Bot cannot start without API connection.',
      );

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'API health check failed:',
        undefined,
      );
    });

    it('should handle object rejection values without message property', async () => {
      const errorObject = { code: 'ECONNREFUSED', status: 503 };

      apiService.healthCheck.mockRejectedValue(errorObject);

      const thrownError = await service.checkHealth().catch((e) => e as Error);
      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toBe(
        'API health check failed: API unavailable. Bot cannot start without API connection.',
      );

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'API health check failed:',
        errorObject,
      );
    });

    it('should log appropriate messages in correct order on success', async () => {
      apiService.healthCheck.mockResolvedValue({ status: 'ok' });

      await service.checkHealth();

      expect(loggerSpy.log).toHaveBeenNthCalledWith(
        1,
        'Checking API health...',
      );
      expect(loggerSpy.log).toHaveBeenNthCalledWith(
        2,
        'API health check passed',
      );
    });

    it('should log appropriate messages in correct order on failure', async () => {
      const error = new Error('Test error');
      apiService.healthCheck.mockRejectedValue(error);

      await expect(service.checkHealth()).rejects.toThrow();

      expect(loggerSpy.log).toHaveBeenCalledWith('Checking API health...');
      expect(loggerSpy.error).toHaveBeenCalledWith(
        'API health check failed:',
        error,
      );
      expect(loggerSpy.log).not.toHaveBeenCalledWith('API health check passed');
    });

    it('should include bot startup message in error when health check fails', async () => {
      const error = new Error('Network error');
      apiService.healthCheck.mockRejectedValue(error);

      await expect(service.checkHealth()).rejects.toThrow(Error);
      const thrownError = await service.checkHealth().catch((e) => e as Error);
      expect(thrownError).toBeInstanceOf(Error);
      expect(thrownError.message).toContain(
        'Bot cannot start without API connection',
      );
    });
  });
});
