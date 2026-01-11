import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { DiscordService } from './discord.service';
import type { ContextOf } from 'necord';

describe('DiscordService', () => {
  let service: DiscordService;
  let module: TestingModule;
  let loggerSpy: {
    log: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [DiscordService],
    }).compile();

    service = module.get<DiscordService>(DiscordService);

    // Spy on Logger prototype methods to verify logging behavior
    loggerSpy = {
      log: jest.spyOn(Logger.prototype, 'log').mockImplementation(),
      warn: jest.spyOn(Logger.prototype, 'warn').mockImplementation(),
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

  describe('onReady', () => {
    it('should log username when client.user exists with username', () => {
      const mockClient = {
        user: {
          id: '123456789012345678',
          username: 'TestBot',
        },
      };

      service.onReady([mockClient] as unknown as ContextOf<'ready'>);

      expect(loggerSpy.log).toHaveBeenCalledWith('Bot logged in as TestBot');
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot is ready and online in Discord',
      );
      expect(loggerSpy.log).toHaveBeenCalledTimes(2);
      expect(loggerSpy.error).not.toHaveBeenCalled();
    });

    it('should log user ID when client.user exists but username is null', () => {
      const mockClient = {
        user: {
          id: '123456789012345678',
          username: null,
        },
      };

      service.onReady([mockClient] as unknown as ContextOf<'ready'>);

      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot logged in as 123456789012345678',
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot is ready and online in Discord',
      );
      expect(loggerSpy.log).toHaveBeenCalledTimes(2);
      expect(loggerSpy.error).not.toHaveBeenCalled();
    });

    it('should log user ID when client.user exists but username is undefined', () => {
      const mockClient = {
        user: {
          id: '123456789012345678',
          username: undefined,
        },
      };

      service.onReady([mockClient] as unknown as ContextOf<'ready'>);

      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot logged in as 123456789012345678',
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot is ready and online in Discord',
      );
    });

    it('should log Unknown when client.user exists but both username and id are null', () => {
      const mockClient = {
        user: {
          id: null,
          username: null,
        },
      };

      service.onReady([mockClient] as unknown as ContextOf<'ready'>);

      expect(loggerSpy.log).toHaveBeenCalledWith('Bot logged in as Unknown');
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot is ready and online in Discord',
      );
    });

    it('should log Unknown when client.user exists but both username and id are undefined', () => {
      const mockClient = {
        user: {
          id: undefined,
          username: undefined,
        },
      };

      service.onReady([mockClient] as unknown as ContextOf<'ready'>);

      expect(loggerSpy.log).toHaveBeenCalledWith('Bot logged in as Unknown');
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot is ready and online in Discord',
      );
    });

    it('should log error and return early when client.user is null', () => {
      const mockClient = {
        user: null,
      };

      service.onReady([mockClient] as unknown as ContextOf<'ready'>);

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Client user is null during ready event - this should not happen',
      );
      expect(loggerSpy.log).not.toHaveBeenCalled();
    });

    it('should log error and return early when client.user is undefined', () => {
      const mockClient = {
        user: undefined,
      };

      service.onReady([mockClient] as unknown as ContextOf<'ready'>);

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Client user is null during ready event - this should not happen',
      );
      expect(loggerSpy.log).not.toHaveBeenCalled();
    });

    it('should prefer username over id when both are available', () => {
      const mockClient = {
        user: {
          id: '123456789012345678',
          username: 'PreferredUsername',
        },
      };

      service.onReady([mockClient] as unknown as ContextOf<'ready'>);

      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Bot logged in as PreferredUsername',
      );
      expect(loggerSpy.log).not.toHaveBeenCalledWith(
        expect.stringContaining('123456789012345678'),
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
