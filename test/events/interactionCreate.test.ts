import { createInteractionCreateEvent } from '../../src/events/interactionCreate';
import { CommandRegistryService } from '../../src/commands/command-registry.service';
import { PermissionValidatorService } from '../../src/services/permission-validator.service';
import { PermissionLoggerService } from '../../src/services/permission-logger.service';
import { ApiService } from '../../src/services/api.service';
import { CooldownService } from '../../src/services/cooldown.service';
import { ConfigService } from '../../src/services/config.service';
import { ICommand } from '../../src/commands/command.interface';
import { ChatInputCommandInteraction, Events } from 'discord.js';
import { logger } from '../../src/utils/logger';

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('InteractionCreate Event Handler', () => {
  let mockCommandRegistry: jest.Mocked<CommandRegistryService>;
  let mockPermissionValidator: jest.Mocked<PermissionValidatorService>;
  let mockPermissionLogger: jest.Mocked<PermissionLoggerService>;
  let mockApiService: jest.Mocked<ApiService>;
  let mockCooldownService: jest.Mocked<CooldownService>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockCommand: jest.Mocked<ICommand>;
  let mockInteraction: jest.Mocked<ChatInputCommandInteraction>;

  beforeEach(() => {
    // Create mocks
    mockCommandRegistry = {
      get: jest.fn(),
    } as unknown as jest.Mocked<CommandRegistryService>;

    mockPermissionValidator = {
      validateCommandPermissions: jest.fn().mockReturnValue({ allowed: true }),
    } as unknown as jest.Mocked<PermissionValidatorService>;

    mockPermissionLogger = {
      logCommandExecution: jest.fn(),
      logPermissionDenial: jest.fn(),
      logPermissionGrant: jest.fn(),
    } as unknown as jest.Mocked<PermissionLoggerService>;

    mockApiService = {
      getGuildSettings: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<ApiService>;

    mockCooldownService = {
      checkCooldown: jest.fn().mockReturnValue(0),
      setCooldown: jest.fn(),
    } as unknown as jest.Mocked<CooldownService>;

    mockConfigService = {
      allowedUserId: undefined,
    } as unknown as jest.Mocked<ConfigService>;

    mockCommand = {
      data: {
        name: 'test-command',
        description: 'Test command',
      },
      execute: jest.fn().mockResolvedValue(undefined),
      metadata: {
        category: 'public' as const,
        requiresGuild: false,
      },
    } as unknown as jest.Mocked<ICommand>;

    mockInteraction = {
      isChatInputCommand: jest.fn().mockReturnValue(true),
      commandName: 'test-command',
      user: {
        id: '123456789012345678',
        username: 'testuser',
        globalName: 'Test User',
        avatar: 'avatar_hash',
      },
      guildId: null,
      channelId: 'channel-123',
      reply: jest.fn().mockResolvedValue(undefined),
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      followUp: jest.fn().mockResolvedValue(undefined),
      replied: false,
      deferred: false,
      inGuild: jest.fn().mockReturnValue(false),
      member: null,
    } as unknown as jest.Mocked<ChatInputCommandInteraction>;

    mockCommandRegistry.get.mockReturnValue(mockCommand);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User ID Restriction', () => {
    it('should allow command execution when ALLOWED_USER_ID is not set', async () => {
      // Arrange
      mockConfigService.allowedUserId = undefined;
      const event = createInteractionCreateEvent(
        mockCommandRegistry,
        mockPermissionValidator,
        mockPermissionLogger,
        mockApiService,
        mockCooldownService,
        mockConfigService
      );

      // Act
      await event.execute(mockInteraction);

      // Assert
      expect(mockCommand.execute).toHaveBeenCalled();
      expect(mockInteraction.reply).not.toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'You do not have permission to use this command',
        })
      );
    });

    it('should allow command execution when user ID matches ALLOWED_USER_ID', async () => {
      // Arrange
      const allowedUserId = '123456789012345678';
      mockConfigService.allowedUserId = allowedUserId;
      mockInteraction.user.id = allowedUserId;

      const event = createInteractionCreateEvent(
        mockCommandRegistry,
        mockPermissionValidator,
        mockPermissionLogger,
        mockApiService,
        mockCooldownService,
        mockConfigService
      );

      // Act
      await event.execute(mockInteraction);

      // Assert
      expect(mockCommand.execute).toHaveBeenCalled();
      expect(mockInteraction.reply).not.toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'You do not have permission to use this command',
        })
      );
    });

    it('should deny command execution when user ID does not match ALLOWED_USER_ID', async () => {
      // Arrange
      const allowedUserId = '354474826192388127';
      mockConfigService.allowedUserId = allowedUserId;
      mockInteraction.user.id = '999999999999999999'; // Different user

      const event = createInteractionCreateEvent(
        mockCommandRegistry,
        mockPermissionValidator,
        mockPermissionLogger,
        mockApiService,
        mockCooldownService,
        mockConfigService
      );

      // Act
      await event.execute(mockInteraction);

      // Assert
      expect(mockCommand.execute).not.toHaveBeenCalled();
      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: 'You do not have permission to use this command',
        ephemeral: true,
      });
      expect(logger.warn).toHaveBeenCalledWith(
        'Unauthorized command access attempt',
        expect.objectContaining({
          userId: '999999999999999999',
          commandName: 'test-command',
        })
      );
    });

    it('should log unauthorized access attempt with correct details', async () => {
      // Arrange
      const allowedUserId = '354474826192388127';
      mockConfigService.allowedUserId = allowedUserId;
      mockInteraction.user.id = '999999999999999999';
      mockInteraction.guildId = 'guild-123';

      const event = createInteractionCreateEvent(
        mockCommandRegistry,
        mockPermissionValidator,
        mockPermissionLogger,
        mockApiService,
        mockCooldownService,
        mockConfigService
      );

      // Act
      await event.execute(mockInteraction);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        'Unauthorized command access attempt',
        expect.objectContaining({
          userId: '999999999999999999',
          username: 'testuser',
          commandName: 'test-command',
          guildId: 'guild-123',
          channelId: 'channel-123',
        })
      );
    });

    it('should check user ID before any other permission checks', async () => {
      // Arrange
      const allowedUserId = '354474826192388127';
      mockConfigService.allowedUserId = allowedUserId;
      mockInteraction.user.id = '999999999999999999';

      const event = createInteractionCreateEvent(
        mockCommandRegistry,
        mockPermissionValidator,
        mockPermissionLogger,
        mockApiService,
        mockCooldownService,
        mockConfigService
      );

      // Act
      await event.execute(mockInteraction);

      // Assert
      // Should not call API service for guild settings
      expect(mockApiService.getGuildSettings).not.toHaveBeenCalled();
      // Should not check cooldown
      expect(mockCooldownService.checkCooldown).not.toHaveBeenCalled();
      // Should not validate permissions
      expect(mockPermissionValidator.validateCommandPermissions).not.toHaveBeenCalled();
    });
  });

  describe('Event Name', () => {
    it('should return correct event name', () => {
      const event = createInteractionCreateEvent(
        mockCommandRegistry,
        mockPermissionValidator,
        mockPermissionLogger,
        mockApiService,
        mockCooldownService,
        mockConfigService
      );

      expect(event.name).toBe(Events.InteractionCreate);
    });
  });
});

