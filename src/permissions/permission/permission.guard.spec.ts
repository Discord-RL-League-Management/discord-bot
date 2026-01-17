import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionGuard } from './permission.guard';
import { PermissionValidatorService } from '../permission-validator/permission-validator.service';
import { PermissionLoggerService } from '../permission-logger/permission-logger.service';
import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { ValidationResult } from '../permission-validator/permission-validator.service';
import { AppLogger } from '../../common/app-logger.service';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let validatorService: jest.Mocked<PermissionValidatorService>;
  let loggerService: jest.Mocked<PermissionLoggerService>;
  let mockExecutionContext: ExecutionContext;
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
    commandName: 'test-command',
    replied: false,
    deferred: false,
    reply: jest.fn().mockResolvedValue(undefined),
    followUp: jest.fn().mockResolvedValue(undefined),
  } as unknown as ChatInputCommandInteraction;

  beforeEach(async () => {
    const mockValidatorService = {
      validateCommandPermissions: jest.fn(),
    };

    const mockLoggerService = {
      logCommandExecution: jest.fn(),
      logPermissionDenial: jest.fn(),
      logPermissionGrant: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
        {
          provide: PermissionValidatorService,
          useValue: mockValidatorService,
        },
        {
          provide: PermissionLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    validatorService = module.get(PermissionValidatorService);
    loggerService = module.get(PermissionLoggerService);

    mockExecutionContext = {
      getArgs: jest.fn().mockReturnValue([mockInteraction]),
      switchToHttp: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
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
    it('should return true when no Discord interaction', async () => {
      const nonDiscordContext = {
        ...mockExecutionContext,
        getArgs: jest.fn().mockReturnValue([{ type: 'not-discord' }]),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(nonDiscordContext);
      expect(result).toBe(true);
      expect(
        validatorService.validateCommandPermissions,
      ).not.toHaveBeenCalled();
    });

    it('should return true when permission is granted', async () => {
      const result: ValidationResult = { allowed: true };
      validatorService.validateCommandPermissions.mockResolvedValue(result);

      const canActivate = await guard.canActivate(mockExecutionContext);

      expect(canActivate).toBe(true);
      expect(validatorService.validateCommandPermissions).toHaveBeenCalled();
      expect(loggerService.logCommandExecution).toHaveBeenCalled();
      expect(loggerService.logPermissionGrant).toHaveBeenCalled();
      expect(mockInteraction.reply).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when permission is denied', async () => {
      const result: ValidationResult = {
        allowed: false,
        reason: 'You do not have permission',
      };
      validatorService.validateCommandPermissions.mockResolvedValue(result);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );

      expect(validatorService.validateCommandPermissions).toHaveBeenCalled();
      expect(loggerService.logCommandExecution).toHaveBeenCalled();
      expect(loggerService.logPermissionDenial).toHaveBeenCalledWith(
        mockInteraction,
        'You do not have permission',
      );
      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: 'You do not have permission',
        flags: MessageFlags.Ephemeral,
      });
    });

    it('should send denial message via reply when not replied or deferred', async () => {
      const result: ValidationResult = {
        allowed: false,
        reason: 'Permission denied',
      };
      validatorService.validateCommandPermissions.mockResolvedValue(result);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: 'Permission denied',
        flags: MessageFlags.Ephemeral,
      });
      expect(mockInteraction.followUp).not.toHaveBeenCalled();
    });

    it('should send denial message via followUp when already replied', async () => {
      const repliedInteraction = {
        ...mockInteraction,
        replied: true,
      } as unknown as ChatInputCommandInteraction;

      const repliedContext = {
        ...mockExecutionContext,
        getArgs: jest.fn().mockReturnValue([repliedInteraction]),
      } as unknown as ExecutionContext;

      const result: ValidationResult = {
        allowed: false,
        reason: 'Permission denied',
      };
      validatorService.validateCommandPermissions.mockResolvedValue(result);

      await expect(guard.canActivate(repliedContext)).rejects.toThrow(
        ForbiddenException,
      );

      expect(repliedInteraction.followUp).toHaveBeenCalledWith({
        content: 'Permission denied',
        flags: MessageFlags.Ephemeral,
      });
      expect(repliedInteraction.reply).not.toHaveBeenCalled();
    });

    it('should use default reason when reason is not provided', async () => {
      const result: ValidationResult = {
        allowed: false,
      };
      validatorService.validateCommandPermissions.mockResolvedValue(result);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );

      expect(loggerService.logPermissionDenial).toHaveBeenCalledWith(
        mockInteraction,
        'Access denied',
      );
      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: '❌ You do not have permission to use this command.',
        flags: MessageFlags.Ephemeral,
      });
    });

    it('should handle error in validator service gracefully', async () => {
      const error = new Error('Validation error');
      validatorService.validateCommandPermissions.mockRejectedValue(error);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content:
          'An error occurred while checking permissions. Please try again later.',
        flags: MessageFlags.Ephemeral,
      });
    });

    it('should re-throw ForbiddenException if already thrown', async () => {
      const forbiddenError = new ForbiddenException('Permission denied');
      validatorService.validateCommandPermissions.mockRejectedValue(
        forbiddenError,
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockInteraction.reply).not.toHaveBeenCalled();
    });

    it('should handle error sending denial message gracefully', async () => {
      const result: ValidationResult = {
        allowed: false,
        reason: 'Permission denied',
      };
      validatorService.validateCommandPermissions.mockResolvedValue(result);
      const errorInteraction = {
        ...mockInteraction,
        reply: jest.fn().mockRejectedValue(new Error('Send failed')),
      } as unknown as ChatInputCommandInteraction;

      const errorContext = {
        ...mockExecutionContext,
        getArgs: jest.fn().mockReturnValue([errorInteraction]),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(errorContext)).rejects.toThrow(
        ForbiddenException,
      );

      // Should not throw even if reply fails
      expect(errorInteraction.reply).toHaveBeenCalled();
    });
  });
});
