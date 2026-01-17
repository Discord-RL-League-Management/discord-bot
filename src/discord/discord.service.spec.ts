import { Test, TestingModule } from '@nestjs/testing';
import { DiscordService } from './discord.service';
import { GuildSyncService } from '../guild/guild-sync.service';
import type { ContextOf } from 'necord';
import { AppLogger } from '../common/app-logger.service';

describe('DiscordService', () => {
  let service: DiscordService;
  let module: TestingModule;
  let loggerSpy: {
    log: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  const mockGuildSyncService = {
    syncAllGuilds: jest
      .fn()
      .mockResolvedValue({ synced: 0, total: 0, failed: 0 }),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    mockGuildSyncService.syncAllGuilds.mockClear();

    module = await Test.createTestingModule({
      providers: [
        DiscordService,
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
        {
          provide: GuildSyncService,
          useValue: mockGuildSyncService,
        },
      ],
    }).compile();

    service = module.get<DiscordService>(DiscordService);

    // Spy on mock Logger methods to verify logging behavior
    loggerSpy = {
      log: jest.spyOn(mockLogger, 'log'),
      warn: jest.spyOn(mockLogger, 'warn'),
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

  describe('onReady', () => {
    it('should log username when client.user exists with username', async () => {
      const mockClient = {
        user: {
          id: '123456789012345678',
          username: 'TestBot',
        },
        guilds: { cache: new Map() },
      };

      await service.onReady([
        mockClient,
      ] as unknown as ContextOf<'clientReady'>);

      expect(loggerSpy.log).toHaveBeenCalledWith('Bot logged in as TestBot');
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot is ready and online in Discord',
      );
      // Additional logs for guild sync: "Starting guild sync..." and "Guild sync complete: ..."
      expect(loggerSpy.log).toHaveBeenCalledWith('Starting guild sync...');
      expect(mockGuildSyncService.syncAllGuilds).toHaveBeenCalledWith(
        mockClient,
      );
      expect(loggerSpy.error).not.toHaveBeenCalled();
    });

    it('should log user ID when client.user exists but username is null', async () => {
      const mockClient = {
        user: {
          id: '123456789012345678',
          username: null,
        },
        guilds: { cache: new Map() },
      };

      await service.onReady([
        mockClient,
      ] as unknown as ContextOf<'clientReady'>);

      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot logged in as 123456789012345678',
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot is ready and online in Discord',
      );
      // Additional logs for guild sync
      expect(loggerSpy.log).toHaveBeenCalledWith('Starting guild sync...');
      expect(mockGuildSyncService.syncAllGuilds).toHaveBeenCalledWith(
        mockClient,
      );
      expect(loggerSpy.error).not.toHaveBeenCalled();
    });

    it('should log user ID when client.user exists but username is undefined', async () => {
      const mockClient = {
        user: {
          id: '123456789012345678',
          username: undefined,
        },
        guilds: { cache: new Map() },
      };

      await service.onReady([
        mockClient,
      ] as unknown as ContextOf<'clientReady'>);

      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot logged in as 123456789012345678',
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot is ready and online in Discord',
      );
    });

    it('should log Unknown when client.user exists but both username and id are null', async () => {
      const mockClient = {
        user: {
          id: null,
          username: null,
        },
        guilds: { cache: new Map() },
      };

      await service.onReady([
        mockClient,
      ] as unknown as ContextOf<'clientReady'>);

      expect(loggerSpy.log).toHaveBeenCalledWith('Bot logged in as Unknown');
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot is ready and online in Discord',
      );
    });

    it('should log Unknown when client.user exists but both username and id are undefined', async () => {
      const mockClient = {
        user: {
          id: undefined,
          username: undefined,
        },
        guilds: { cache: new Map() },
      };

      await service.onReady([
        mockClient,
      ] as unknown as ContextOf<'clientReady'>);

      expect(loggerSpy.log).toHaveBeenCalledWith('Bot logged in as Unknown');
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot is ready and online in Discord',
      );
    });

    it('should log error and return early when client.user is null', async () => {
      const mockClient = {
        user: null,
      };

      await service.onReady([
        mockClient,
      ] as unknown as ContextOf<'clientReady'>);

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Client user is null during clientReady event - this should not happen',
      );
      expect(loggerSpy.log).not.toHaveBeenCalled();
    });

    it('should log error and return early when client.user is undefined', async () => {
      const mockClient = {
        user: undefined,
      };

      await service.onReady([
        mockClient,
      ] as unknown as ContextOf<'clientReady'>);

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Client user is null during clientReady event - this should not happen',
      );
      expect(loggerSpy.log).not.toHaveBeenCalled();
    });

    it('should prefer username over id when both are available', async () => {
      const mockClient = {
        user: {
          id: '123456789012345678',
          username: 'PreferredUsername',
        },
        guilds: { cache: new Map() },
      };

      await service.onReady([
        mockClient,
      ] as unknown as ContextOf<'clientReady'>);

      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot logged in as PreferredUsername',
      );
      // Note: The guild sync log does not contain the user ID
      expect(loggerSpy.log).not.toHaveBeenCalledWith(
        'Bot logged in as 123456789012345678',
      );
    });
  });

  describe('onWarn', () => {
    it('should log warning message when warn event is emitted', () => {
      const warningMessage = 'Rate limit approaching';

      service.onWarn([warningMessage] as unknown as ContextOf<'warn'>);

      expect(loggerSpy.warn).toHaveBeenCalledWith(
        `Discord client warning: ${warningMessage}`,
      );
      expect(loggerSpy.warn).toHaveBeenCalledTimes(1);
    });

    it('should log warning with string message', () => {
      const warningMessage = 'Connection unstable';

      service.onWarn([warningMessage] as unknown as ContextOf<'warn'>);

      expect(loggerSpy.warn).toHaveBeenCalledWith(
        'Discord client warning: Connection unstable',
      );
    });

    it('should handle empty warning message', () => {
      const warningMessage = '';

      service.onWarn([warningMessage] as unknown as ContextOf<'warn'>);

      expect(loggerSpy.warn).toHaveBeenCalledWith('Discord client warning: ');
    });
  });

  describe('onError', () => {
    it('should log error when error event is emitted with Error object', () => {
      const error = new Error('Connection failed');

      service.onError([error] as unknown as ContextOf<'error'>);

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Discord client error:',
        error,
      );
      expect(loggerSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should log error when error event is emitted with string', () => {
      const error = 'Network timeout';

      service.onError([error] as unknown as ContextOf<'error'>);

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Discord client error:',
        error,
      );
    });

    it('should log error when error event is emitted with object', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };

      service.onError([error] as unknown as ContextOf<'error'>);

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Discord client error:',
        error,
      );
    });

    it('should handle null error gracefully', () => {
      const error = null;

      service.onError([error] as unknown as ContextOf<'error'>);

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Discord client error:',
        null,
      );
    });

    it('should handle undefined error gracefully', () => {
      const error = undefined;

      service.onError([error] as unknown as ContextOf<'error'>);

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Discord client error:',
        undefined,
      );
    });
  });
});
