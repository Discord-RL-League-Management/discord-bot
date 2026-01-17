import { Test, TestingModule } from '@nestjs/testing';
import { PermissionLoggerService } from './permission-logger.service';
import { ChatInputCommandInteraction } from 'discord.js';
import { ValidationResult } from '../permission-validator/permission-validator.service';
import { PermissionMetadata } from '../permission-metadata.interface';
import { AppLogger } from '../../common/app-logger.service';

describe('PermissionLoggerService', () => {
  let service: PermissionLoggerService;
  let module: TestingModule;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  const mockInteraction = {
    user: { id: '123456789012345678' },
    guildId: '987654321098765432',
    channelId: '111111111111111111',
    commandName: 'test-command',
  } as unknown as ChatInputCommandInteraction;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        PermissionLoggerService,
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<PermissionLoggerService>(PermissionLoggerService);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logCommandExecution', () => {
    it('should log command execution with allowed result', () => {
      const result: ValidationResult = { allowed: true };
      const metadata: PermissionMetadata = { category: 'admin' };

      const logSpy = jest.spyOn(service['logger'], 'log');

      service.logCommandExecution(mockInteraction, result, metadata);

      expect(logSpy).toHaveBeenCalledWith(
        'Permission validation: test-command',
        {
          userId: '123456789012345678',
          guildId: '987654321098765432',
          channelId: '111111111111111111',
          allowed: true,
          category: 'admin',
        },
      );
    });

    it('should log command execution with denied result', () => {
      const result: ValidationResult = {
        allowed: false,
        reason: 'Permission denied',
      };
      const metadata: PermissionMetadata = { category: 'admin' };

      const logSpy = jest.spyOn(service['logger'], 'log');

      service.logCommandExecution(mockInteraction, result, metadata);

      expect(logSpy).toHaveBeenCalledWith(
        'Permission validation: test-command',
        {
          userId: '123456789012345678',
          guildId: '987654321098765432',
          channelId: '111111111111111111',
          allowed: false,
          category: 'admin',
        },
      );
    });

    it('should use default category when metadata category is not provided', () => {
      const result: ValidationResult = { allowed: true };

      const logSpy = jest.spyOn(service['logger'], 'log');

      service.logCommandExecution(mockInteraction, result);

      expect(logSpy).toHaveBeenCalledWith(
        'Permission validation: test-command',
        {
          userId: '123456789012345678',
          guildId: '987654321098765432',
          channelId: '111111111111111111',
          allowed: true,
          category: 'public',
        },
      );
    });

    it('should handle DM interactions', () => {
      const dmInteraction = {
        ...mockInteraction,
        guildId: null,
        channelId: null,
      } as unknown as ChatInputCommandInteraction;
      const result: ValidationResult = { allowed: true };

      const logSpy = jest.spyOn(service['logger'], 'log');

      service.logCommandExecution(dmInteraction, result);

      expect(logSpy).toHaveBeenCalledWith(
        'Permission validation: test-command',
        {
          userId: '123456789012345678',
          guildId: 'DM',
          channelId: 'unknown',
          allowed: true,
          category: 'public',
        },
      );
    });
  });

  describe('logPermissionDenial', () => {
    it('should log permission denial with reason', () => {
      const reason = 'You do not have permission to use this command';

      const warnSpy = jest.spyOn(service['logger'], 'warn');

      service.logPermissionDenial(mockInteraction, reason);

      expect(warnSpy).toHaveBeenCalledWith('Permission denied', {
        userId: '123456789012345678',
        guildId: '987654321098765432',
        commandName: 'test-command',
        reason,
      });
    });

    it('should handle DM interactions', () => {
      const dmInteraction = {
        ...mockInteraction,
        guildId: null,
      } as unknown as ChatInputCommandInteraction;
      const reason = 'Permission denied';

      const warnSpy = jest.spyOn(service['logger'], 'warn');

      service.logPermissionDenial(dmInteraction, reason);

      expect(warnSpy).toHaveBeenCalledWith('Permission denied', {
        userId: '123456789012345678',
        guildId: 'DM',
        commandName: 'test-command',
        reason,
      });
    });
  });

  describe('logPermissionGrant', () => {
    it('should log permission grant', () => {
      const metadata: PermissionMetadata = { category: 'admin' };

      const logSpy = jest.spyOn(service['logger'], 'log');

      service.logPermissionGrant(mockInteraction, metadata);

      expect(logSpy).toHaveBeenCalledWith('Permission granted', {
        userId: '123456789012345678',
        guildId: '987654321098765432',
        commandName: 'test-command',
        category: 'admin',
      });
    });

    it('should use default category when metadata category is not provided', () => {
      const logSpy = jest.spyOn(service['logger'], 'log');

      service.logPermissionGrant(mockInteraction);

      expect(logSpy).toHaveBeenCalledWith('Permission granted', {
        userId: '123456789012345678',
        guildId: '987654321098765432',
        commandName: 'test-command',
        category: 'public',
      });
    });

    it('should handle DM interactions', () => {
      const dmInteraction = {
        ...mockInteraction,
        guildId: null,
      } as unknown as ChatInputCommandInteraction;

      const logSpy = jest.spyOn(service['logger'], 'log');

      service.logPermissionGrant(dmInteraction);

      expect(logSpy).toHaveBeenCalledWith('Permission granted', {
        userId: '123456789012345678',
        guildId: 'DM',
        commandName: 'test-command',
        category: 'public',
      });
    });
  });
});
