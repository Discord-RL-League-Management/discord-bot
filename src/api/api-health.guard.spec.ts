import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { ApiHealthGuard } from './api-health.guard';
import { ApiHealthService } from './api-health.service';

describe('ApiHealthGuard', () => {
  let guard: ApiHealthGuard;
  let apiHealthService: jest.Mocked<ApiHealthService>;
  let mockExecutionContext: ExecutionContext;
  let module: TestingModule;

  beforeEach(async () => {
    const mockApiHealthService = {
      checkHealth: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        ApiHealthGuard,
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

    // Reset mock between tests
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
      const checkHealthMock = jest.fn().mockResolvedValueOnce(undefined);
      apiHealthService.checkHealth = checkHealthMock;

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(checkHealthMock).toHaveBeenCalledTimes(1);
    });

    it('should throw ServiceUnavailableException when API health check fails with Error', async () => {
      const errorMessage = 'Connection timeout';
      apiHealthService.checkHealth.mockRejectedValue(new Error(errorMessage));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        `API is currently unavailable: ${errorMessage}. Request cannot be processed.`,
      );
    });

    it('should throw ServiceUnavailableException when API health check fails with non-Error', async () => {
      apiHealthService.checkHealth.mockRejectedValue('API unavailable');

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'API is currently unavailable: API unavailable. Request cannot be processed.',
      );
    });

    it('should throw ServiceUnavailableException with default message when error has no message', async () => {
      apiHealthService.checkHealth.mockRejectedValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'API is currently unavailable: API unavailable. Request cannot be processed.',
      );
    });
  });
});
