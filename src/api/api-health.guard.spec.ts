import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { ApiHealthGuard } from './api-health.guard';
import { ApiHealthService } from './api-health.service';
import { AppLogger } from '../common/app-logger.service';

describe('ApiHealthGuard', () => {
  let guard: ApiHealthGuard;
  let apiHealthService: jest.Mocked<ApiHealthService>;
  let mockExecutionContext: ExecutionContext;
  let module: TestingModule;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const mockApiHealthService = {
      checkHealth: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        ApiHealthGuard,
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
        {
          provide: ApiHealthService,
          useValue: mockApiHealthService,
        },
      ],
    }).compile();

    guard = module.get<ApiHealthGuard>(ApiHealthGuard);
    apiHealthService = module.get(ApiHealthService);
    mockExecutionContext = {
      switchToHttp: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when API health check succeeds', async () => {
      jest
        .spyOn(apiHealthService, 'checkHealth')
        .mockResolvedValueOnce(undefined);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(apiHealthService.checkHealth).toHaveBeenCalledTimes(1);
    });

    it('should throw ServiceUnavailableException when API health check fails with Error', async () => {
      const errorMessage = 'Connection timeout';
      apiHealthService.checkHealth.mockRejectedValue(new Error(errorMessage));

      const error = await guard
        .canActivate(mockExecutionContext)
        .catch((e) => e as ServiceUnavailableException);
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(error.message).toBe(
        `API is currently unavailable: ${errorMessage}. Request cannot be processed.`,
      );
    });

    it('should throw ServiceUnavailableException when API health check fails with non-Error', async () => {
      apiHealthService.checkHealth.mockRejectedValue('API unavailable');

      const error = await guard
        .canActivate(mockExecutionContext)
        .catch((e) => e as ServiceUnavailableException);
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(error.message).toBe(
        'API is currently unavailable: API unavailable. Request cannot be processed.',
      );
    });

    it('should throw ServiceUnavailableException with default message when error has no message', async () => {
      apiHealthService.checkHealth.mockRejectedValue(null);

      const error = await guard
        .canActivate(mockExecutionContext)
        .catch((e) => e as ServiceUnavailableException);
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(error.message).toBe(
        'API is currently unavailable: API unavailable. Request cannot be processed.',
      );
    });
  });
});
