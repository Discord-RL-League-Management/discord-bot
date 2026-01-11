import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Guild } from 'discord.js';
import { GuildService } from './guild.service';
import { ApiService } from '../api/api.service';

describe('GuildService', () => {
  let service: GuildService;
  let module: TestingModule;
  let apiService: jest.Mocked<ApiService>;
  let loggerSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  const mockApiService = {
    upsertGuild: jest.fn(),
    removeGuild: jest.fn(),
  };

  const createMockGuild = (overrides?: Partial<Guild>): Guild => {
    return {
      id: '123456789012345678',
      name: 'Test Guild',
      ownerId: '987654321098765432',
      memberCount: 100,
      icon: 'test-icon',
      ...overrides,
    } as unknown as Guild;
  };

  beforeEach(async () => {
    mockApiService.upsertGuild.mockClear();
    mockApiService.removeGuild.mockClear();

    module = await Test.createTestingModule({
      providers: [
        GuildService,
        {
          provide: ApiService,
          useValue: mockApiService,
        },
      ],
    }).compile();

    service = module.get<GuildService>(GuildService);
    apiService = module.get(ApiService);

    loggerSpy = {
      log: jest.spyOn(Logger.prototype, 'log').mockImplementation(),
      error: jest.spyOn(Logger.prototype, 'error').mockImplementation(),
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

  describe('handleGuildJoin', () => {
    it('should successfully initialize guild when API call succeeds', async () => {
      const mockGuild = createMockGuild();
      apiService.upsertGuild.mockResolvedValue({ id: mockGuild.id });

      await service.handleGuildJoin(mockGuild);

      expect(apiService.upsertGuild).toHaveBeenCalledTimes(1);
      expect(apiService.upsertGuild).toHaveBeenCalledWith({
        id: '123456789012345678',
        name: 'Test Guild',
        ownerId: '987654321098765432',
        memberCount: 100,
        icon: 'test-icon',
      });
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot joined guild: Test Guild (123456789012345678)',
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Successfully initialized guild: Test Guild',
      );
      expect(loggerSpy.error).not.toHaveBeenCalled();
    });

    it('should handle guild with no icon (null icon)', async () => {
      const mockGuild = createMockGuild({ icon: null });
      apiService.upsertGuild.mockResolvedValue({ id: mockGuild.id });

      await service.handleGuildJoin(mockGuild);

      expect(apiService.upsertGuild).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: undefined,
        }),
      );
    });

    it('should throw error and log when API call fails with Error', async () => {
      const mockGuild = createMockGuild();
      const error = new Error('API connection failed');
      apiService.upsertGuild.mockRejectedValue(error);

      await expect(service.handleGuildJoin(mockGuild)).rejects.toThrow(
        'API connection failed',
      );

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Error initializing guild 123456789012345678:',
        'API connection failed',
      );
    });

    it('should throw error and log when API call fails with non-Error', async () => {
      const mockGuild = createMockGuild();
      apiService.upsertGuild.mockRejectedValue('Unknown failure');

      await expect(service.handleGuildJoin(mockGuild)).rejects.toBe(
        'Unknown failure',
      );

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Error initializing guild 123456789012345678:',
        'Unknown error',
      );
    });
  });

  describe('handleGuildLeave', () => {
    it('should successfully remove guild when API call succeeds', async () => {
      const mockGuild = createMockGuild();
      apiService.removeGuild.mockResolvedValue({ deleted: true });

      await service.handleGuildLeave(mockGuild);

      expect(apiService.removeGuild).toHaveBeenCalledTimes(1);
      expect(apiService.removeGuild).toHaveBeenCalledWith('123456789012345678');
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot left guild: Test Guild (123456789012345678)',
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Successfully removed guild: Test Guild',
      );
      expect(loggerSpy.error).not.toHaveBeenCalled();
    });

    it('should not throw error when API call fails (graceful handling)', async () => {
      const mockGuild = createMockGuild();
      const error = new Error('API error during removal');
      apiService.removeGuild.mockRejectedValue(error);

      // Should NOT throw - guild leave failures shouldn't crash the bot
      await expect(
        service.handleGuildLeave(mockGuild),
      ).resolves.toBeUndefined();

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Error handling guild leave 123456789012345678:',
        'API error during removal',
      );
    });

    it('should handle non-Error rejection gracefully', async () => {
      const mockGuild = createMockGuild();
      apiService.removeGuild.mockRejectedValue('String error');

      await expect(
        service.handleGuildLeave(mockGuild),
      ).resolves.toBeUndefined();

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Error handling guild leave 123456789012345678:',
        'Unknown error',
      );
    });
  });
});
