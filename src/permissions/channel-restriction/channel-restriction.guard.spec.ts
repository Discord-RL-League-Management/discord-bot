import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ChannelRestrictionGuard } from './channel-restriction.guard';
import { ApiService } from '../../api/api.service';
import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { AppLogger } from '../../common/app-logger.service';

describe('ChannelRestrictionGuard', () => {
  let apiService: jest.Mocked<ApiService>;
  let module: TestingModule;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  const createMockInteraction = (
    options: {
      guildId?: string | null;
      channelId?: string;
      inGuild?: boolean;
      replied?: boolean;
      deferred?: boolean;
    } = {},
  ): ChatInputCommandInteraction => {
    const {
      guildId = '987654321098765432',
      channelId = '111111111111111111',
      inGuild = true,
      replied = false,
      deferred = false,
    } = options;

    return {
      user: { id: '123456789012345678' },
      guildId,
      channelId,
      commandName: 'test-command',
      inGuild: jest.fn().mockReturnValue(inGuild),
      replied,
      deferred,
      reply: jest.fn().mockResolvedValue(undefined),
      followUp: jest.fn().mockResolvedValue(undefined),
    } as unknown as ChatInputCommandInteraction;
  };

  const createMockExecutionContext = (
    interaction: ChatInputCommandInteraction | null,
  ): ExecutionContext => {
    return {
      getArgs: jest.fn().mockReturnValue(interaction ? [interaction] : []),
      switchToHttp: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const mockApiService = {
      getGuildSettings: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
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

    apiService = module.get(ApiService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Factory method', () => {
    it('should create guard class for staff type', () => {
      const GuardClass = ChannelRestrictionGuard.create('staff');
      expect(GuardClass).toBeDefined();
      expect(typeof GuardClass).toBe('function');
    });

    it('should create guard class for public type', () => {
      const GuardClass = ChannelRestrictionGuard.create('public');
      expect(GuardClass).toBeDefined();
      expect(typeof GuardClass).toBe('function');
    });

    it('should create guard class for test type', () => {
      const GuardClass = ChannelRestrictionGuard.create('test');
      expect(GuardClass).toBeDefined();
      expect(typeof GuardClass).toBe('function');
    });
  });

  describe('canActivate - staff type', () => {
    let guard: any;

    beforeEach(() => {
      const GuardClass = ChannelRestrictionGuard.create('staff');
      const mockLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        setContext: jest.fn(),
      };
      guard = new GuardClass(mockLogger, apiService);
    });

    it('should return true when no Discord interaction', async () => {
      const context = createMockExecutionContext(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(apiService.getGuildSettings).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException in DM context', async () => {
      const interaction = createMockInteraction({
        guildId: null,
        inGuild: false,
      });
      const context = createMockExecutionContext(interaction);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).toHaveBeenCalledWith({
        content: '❌ This command can only be used in servers.',
        flags: MessageFlags.Ephemeral,
      });
    });

    it('should return true when channel arrays are empty', async () => {
      const interaction = createMockInteraction();
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({
        staff_command_channels: [],
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(apiService.getGuildSettings).toHaveBeenCalledWith(
        interaction.guildId,
      );
    });

    it('should return true when channel arrays are missing', async () => {
      const interaction = createMockInteraction();
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({});

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when current channel is in allowed channels', async () => {
      const interaction = createMockInteraction({
        channelId: '111111111111111111',
      });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({
        staff_command_channels: ['111111111111111111', '222222222222222222'],
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when channel not in allowed channels', async () => {
      const interaction = createMockInteraction({
        channelId: '999999999999999999',
      });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({
        staff_command_channels: ['111111111111111111', '222222222222222222'],
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).toHaveBeenCalledWith({
        content: '❌ This command can only be used in staff channels.',
        flags: MessageFlags.Ephemeral,
      });
    });

    it('should send denial message via followUp when already replied', async () => {
      const interaction = createMockInteraction({
        channelId: '999999999999999999',
        replied: true,
      });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({
        staff_command_channels: ['111111111111111111'],
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.followUp).toHaveBeenCalledWith({
        content: '❌ This command can only be used in staff channels.',
        flags: MessageFlags.Ephemeral,
      });
      expect(interaction.reply).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const interaction = createMockInteraction();
      const context = createMockExecutionContext(interaction);

      const error = new Error('API connection failed');
      apiService.getGuildSettings.mockRejectedValue(error);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).toHaveBeenCalledWith({
        content:
          'An error occurred while checking channel restrictions. Please try again later.',
        flags: MessageFlags.Ephemeral,
      });
    });

    it('should re-throw ForbiddenException if already thrown', async () => {
      const interaction = createMockInteraction();
      const context = createMockExecutionContext(interaction);

      const forbiddenError = new ForbiddenException('Already forbidden');
      apiService.getGuildSettings.mockRejectedValue(forbiddenError);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).not.toHaveBeenCalled();
    });

    it('should handle error sending denial message gracefully', async () => {
      const interaction = createMockInteraction({
        channelId: '999999999999999999',
        reply: jest.fn().mockRejectedValue(new Error('Send failed')),
      });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({
        staff_command_channels: ['111111111111111111'],
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).toHaveBeenCalled();
    });
  });

  describe('canActivate - public type', () => {
    let guard: any;

    beforeEach(() => {
      const GuardClass = ChannelRestrictionGuard.create('public');
      const mockLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        setContext: jest.fn(),
      };
      guard = new GuardClass(mockLogger, apiService);
    });

    it('should use public_command_channels key', async () => {
      const interaction = createMockInteraction({
        channelId: '999999999999999999',
      });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({
        public_command_channels: ['111111111111111111'],
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).toHaveBeenCalledWith({
        content: '❌ This command can only be used in public channels.',
        flags: MessageFlags.Ephemeral,
      });
    });
  });

  describe('canActivate - test type', () => {
    let guard: any;

    beforeEach(() => {
      const GuardClass = ChannelRestrictionGuard.create('test');
      const mockLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        setContext: jest.fn(),
      };
      guard = new GuardClass(mockLogger, apiService);
    });

    it('should use test_command_channels key', async () => {
      const interaction = createMockInteraction({
        channelId: '999999999999999999',
      });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({
        test_command_channels: ['111111111111111111'],
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).toHaveBeenCalledWith({
        content: '❌ This command can only be used in test channels.',
        flags: MessageFlags.Ephemeral,
      });
    });
  });
});
