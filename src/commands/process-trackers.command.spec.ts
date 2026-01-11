import { Test, TestingModule } from '@nestjs/testing';
import { ProcessTrackersCommand } from './process-trackers.command';
import { ApiService } from '../api/api.service';
import { ConfigService } from '../config/config.service';
import { AxiosError } from 'axios';
import type { SlashCommandContext } from 'necord';
import { ChatInputCommandInteraction, User } from 'discord.js';

describe('ProcessTrackersCommand', () => {
  let command: ProcessTrackersCommand;
  let apiService: jest.Mocked<ApiService>;
  let configService: jest.Mocked<ConfigService>;
  let module: TestingModule;

  const createMockInteraction = (
    userId: string,
    guildId: string | null = '123456789012345678',
    options: {
      deferred?: boolean;
      replied?: boolean;
    } = {},
  ): ChatInputCommandInteraction => {
    const { deferred = false, replied = false } = options;

    const mockUser = {
      id: userId,
    } as User;

    return {
      user: mockUser,
      guildId,
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined),
      deferred,
      replied,
    } as unknown as ChatInputCommandInteraction;
  };

  beforeEach(async () => {
    const mockApiService = {
      processTrackers: jest.fn(),
    };

    const mockConfigService = {
      getSuperUserId: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        ProcessTrackersCommand,
        {
          provide: ApiService,
          useValue: mockApiService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    command = module.get<ProcessTrackersCommand>(ProcessTrackersCommand);
    apiService = module.get(ApiService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  describe('onProcessTrackers', () => {
    it('should reject unauthorized users', async () => {
      const interaction = createMockInteraction('111111111111111111');
      configService.getSuperUserId.mockReturnValue('999999999999999999');

      await command.onProcessTrackers([interaction] as SlashCommandContext);

      expect(configService.getSuperUserId).toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalledWith({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
      expect(apiService.processTrackers).not.toHaveBeenCalled();
    });

    it('should reject when super user ID is not configured', async () => {
      const interaction = createMockInteraction('111111111111111111');
      configService.getSuperUserId.mockReturnValue(undefined);

      await command.onProcessTrackers([interaction] as SlashCommandContext);

      expect(interaction.reply).toHaveBeenCalledWith({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
      expect(apiService.processTrackers).not.toHaveBeenCalled();
    });

    it('should reject when not in a guild', async () => {
      const interaction = createMockInteraction('999999999999999999', null);
      configService.getSuperUserId.mockReturnValue('999999999999999999');

      await command.onProcessTrackers([interaction] as SlashCommandContext);

      expect(interaction.reply).toHaveBeenCalledWith({
        content: '❌ This command can only be used in a server.',
        ephemeral: true,
      });
      expect(apiService.processTrackers).not.toHaveBeenCalled();
    });

    it('should successfully process trackers for authorized user', async () => {
      const interaction = createMockInteraction('999999999999999999');
      configService.getSuperUserId.mockReturnValue('999999999999999999');
      apiService.processTrackers.mockResolvedValue({
        processed: 5,
        trackers: ['tracker1', 'tracker2'],
      });

      await command.onProcessTrackers([interaction] as SlashCommandContext);

      expect(interaction.deferReply).toHaveBeenCalledWith({
        ephemeral: true,
      });
      expect(apiService.processTrackers).toHaveBeenCalledWith(
        '123456789012345678',
      );
      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.title).toBe(
        '✅ Trackers Processing Started',
      );
      expect(editCall.embeds[0].data.description).toContain('5');
    });

    it('should show info message when no trackers are processed', async () => {
      const interaction = createMockInteraction('999999999999999999');
      configService.getSuperUserId.mockReturnValue('999999999999999999');
      apiService.processTrackers.mockResolvedValue({
        processed: 0,
        trackers: [],
      });

      await command.onProcessTrackers([interaction] as SlashCommandContext);

      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.description).toBe(
        'No pending or stale trackers found to process.',
      );
      expect(editCall.embeds[0].data.color).toBe(0xffaa00); // Orange/yellow
    });

    it('should handle AxiosError with response data message', async () => {
      const interaction = createMockInteraction('999999999999999999');
      configService.getSuperUserId.mockReturnValue('999999999999999999');

      const axiosError = new AxiosError('API Error');
      axiosError.response = {
        data: {
          message: 'Guild not found',
        },
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as any,
      };
      apiService.processTrackers.mockRejectedValue(axiosError);

      await command.onProcessTrackers([interaction] as SlashCommandContext);

      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.title).toBe('❌ Process Trackers Failed');
      expect(editCall.embeds[0].data.description).toBe('Guild not found');
    });

    it('should handle AxiosError without response data message', async () => {
      const interaction = createMockInteraction('999999999999999999');
      configService.getSuperUserId.mockReturnValue('999999999999999999');

      const axiosError = new AxiosError('API Error');
      axiosError.response = {
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };
      apiService.processTrackers.mockRejectedValue(axiosError);

      await command.onProcessTrackers([interaction] as SlashCommandContext);

      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.description).toBe(
        'An error occurred while processing trackers. Please try again.',
      );
    });

    it('should handle generic Error with message', async () => {
      const interaction = createMockInteraction('999999999999999999');
      configService.getSuperUserId.mockReturnValue('999999999999999999');

      const error = new Error('Network timeout');
      apiService.processTrackers.mockRejectedValue(error);

      await command.onProcessTrackers([interaction] as SlashCommandContext);

      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.description).toBe('Network timeout');
    });

    it('should handle unknown error type', async () => {
      const interaction = createMockInteraction('999999999999999999');
      configService.getSuperUserId.mockReturnValue('999999999999999999');

      apiService.processTrackers.mockRejectedValue('String error');

      await command.onProcessTrackers([interaction] as SlashCommandContext);

      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.description).toBe(
        'An error occurred while processing trackers. Please try again.',
      );
    });
  });
});
