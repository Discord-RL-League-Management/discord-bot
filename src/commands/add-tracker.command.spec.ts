import { Test, TestingModule } from '@nestjs/testing';
import { AddTrackerCommand } from './add-tracker.command';
import { ApiService } from '../api/api.service';
import { AxiosError } from 'axios';
import type { SlashCommandContext } from 'necord';
import { ChatInputCommandInteraction, User } from 'discord.js';

describe('AddTrackerCommand', () => {
  let command: AddTrackerCommand;
  let apiService: jest.Mocked<ApiService>;
  let module: TestingModule;

  const createMockInteraction = (
    userId: string,
    username: string,
    trackerUrl: string,
    options: {
      deferred?: boolean;
      replied?: boolean;
      channelId?: string | null;
      globalName?: string | null;
      avatar?: string | null;
    } = {},
  ): ChatInputCommandInteraction => {
    const {
      deferred = false,
      replied = false,
      channelId = '123456789012345678',
      globalName = null,
      avatar = null,
    } = options;

    const mockUser = {
      id: userId,
      username,
      globalName,
      avatar,
    } as User;

    return {
      user: mockUser,
      options: {
        getString: jest.fn().mockReturnValue(trackerUrl),
      },
      deferReply: jest.fn().mockResolvedValue(undefined),
      editReply: jest.fn().mockResolvedValue(undefined),
      reply: jest.fn().mockResolvedValue(undefined),
      deferred,
      replied,
      channelId,
      token: 'test-token',
    } as unknown as ChatInputCommandInteraction;
  };

  beforeEach(async () => {
    const mockApiService = {
      addTracker: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        AddTrackerCommand,
        {
          provide: ApiService,
          useValue: mockApiService,
        },
      ],
    }).compile();

    command = module.get<AddTrackerCommand>(AddTrackerCommand);
    apiService = module.get(ApiService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  describe('onAddTracker', () => {
    it('should successfully add a tracker and send success embed', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
      );

      const mockTrackerResponse = {
        url: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        platform: 'steam',
        username: 'testuser',
        scrapingStatus: 'PENDING',
      };

      apiService.addTracker.mockResolvedValue(mockTrackerResponse);

      await command.onAddTracker([interaction] as SlashCommandContext);

      expect(interaction.deferReply).toHaveBeenCalledWith({
        ephemeral: true,
      });
      expect(apiService.addTracker).toHaveBeenCalledWith(
        '111111111111111111',
        'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        {
          username: 'testuser',
          globalName: undefined,
          avatar: undefined,
        },
        '123456789012345678',
        'test-token',
      );
      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds).toBeDefined();
      expect(editCall.embeds[0].data.title).toBe(
        '✅ Tracker Added Successfully',
      );
    });

    it('should handle tracker response with missing optional fields', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
      );

      const mockTrackerResponse = {
        url: undefined,
        platform: undefined,
        username: undefined,
        scrapingStatus: undefined,
      };

      apiService.addTracker.mockResolvedValue(mockTrackerResponse);

      await command.onAddTracker([interaction] as SlashCommandContext);

      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.fields).toBeDefined();
      // Should use original URL when tracker.url is missing
      expect(
        editCall.embeds[0].data.fields.find(
          (f: any) => f.name === 'Tracker URL',
        )?.value,
      ).toBe(
        'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
      );
    });

    it('should include user globalName and avatar when available', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        {
          globalName: 'Test Global Name',
          avatar: 'avatar-hash',
        },
      );

      const mockTrackerResponse = {
        url: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        platform: 'steam',
        username: 'testuser',
        scrapingStatus: 'PENDING',
      };

      apiService.addTracker.mockResolvedValue(mockTrackerResponse);

      await command.onAddTracker([interaction] as SlashCommandContext);

      expect(apiService.addTracker).toHaveBeenCalledWith(
        '111111111111111111',
        'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        {
          username: 'testuser',
          globalName: 'Test Global Name',
          avatar: 'avatar-hash',
        },
        '123456789012345678',
        'test-token',
      );
    });

    it('should handle AxiosError with response data message', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
      );

      const axiosError = new AxiosError('API Error');
      axiosError.response = {
        data: {
          message: 'Tracker limit reached. Maximum 4 trackers allowed.',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      };
      apiService.addTracker.mockRejectedValue(axiosError);

      await command.onAddTracker([interaction] as SlashCommandContext);

      expect(interaction.deferReply).toHaveBeenCalled();
      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.title).toBe('❌ Add Tracker Failed');
      expect(editCall.embeds[0].data.description).toBe(
        'Tracker limit reached. Maximum 4 trackers allowed.',
      );
    });

    it('should handle AxiosError without response data message', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
      );

      const axiosError = new AxiosError('API Error');
      axiosError.response = {
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };
      apiService.addTracker.mockRejectedValue(axiosError);

      await command.onAddTracker([interaction] as SlashCommandContext);

      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.title).toBe('❌ Add Tracker Failed');
      expect(editCall.embeds[0].data.description).toBe(
        'An error occurred while adding the tracker. Please try again.',
      );
    });

    it('should handle generic Error with message', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
      );

      const error = new Error('Network timeout');
      apiService.addTracker.mockRejectedValue(error);

      await command.onAddTracker([interaction] as SlashCommandContext);

      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.description).toBe('Network timeout');
    });

    it('should handle unknown error type', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
      );

      apiService.addTracker.mockRejectedValue('String error');

      await command.onAddTracker([interaction] as SlashCommandContext);

      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.description).toBe(
        'An error occurred while adding the tracker. Please try again.',
      );
    });

    it('should handle null channelId', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        {
          channelId: null,
        },
      );

      const mockTrackerResponse = {
        url: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        platform: 'steam',
        username: 'testuser',
        scrapingStatus: 'PENDING',
      };

      apiService.addTracker.mockResolvedValue(mockTrackerResponse);

      await command.onAddTracker([interaction] as SlashCommandContext);

      expect(apiService.addTracker).toHaveBeenCalledWith(
        '111111111111111111',
        'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        {
          username: 'testuser',
          globalName: undefined,
          avatar: undefined,
        },
        null,
        'test-token',
      );
    });
  });
});
