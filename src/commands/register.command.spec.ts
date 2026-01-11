import { Test, TestingModule } from '@nestjs/testing';
import { RegisterCommand } from './register.command';
import { ApiService } from '../api/api.service';
import { AxiosError } from 'axios';
import type { SlashCommandContext } from 'necord';
import { ChatInputCommandInteraction, User } from 'discord.js';

describe('RegisterCommand', () => {
  let command: RegisterCommand;
  let apiService: jest.Mocked<ApiService>;
  let module: TestingModule;

  const createMockInteraction = (
    userId: string,
    username: string,
    urls: {
      url1: string;
      url2?: string | null;
      url3?: string | null;
      url4?: string | null;
    },
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
        getString: jest.fn().mockImplementation((name: string) => {
          if (name === 'tracker_url_1') return urls.url1;
          if (name === 'tracker_url_2') return urls.url2 ?? null;
          if (name === 'tracker_url_3') return urls.url3 ?? null;
          if (name === 'tracker_url_4') return urls.url4 ?? null;
          return null;
        }),
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
      registerTrackers: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        RegisterCommand,
        {
          provide: ApiService,
          useValue: mockApiService,
        },
      ],
    }).compile();

    command = module.get<RegisterCommand>(RegisterCommand);
    apiService = module.get(ApiService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  describe('onRegister', () => {
    it('should successfully register a single tracker', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        {
          url1: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        },
      );

      const mockTrackersResponse = [
        {
          url: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
          platform: 'steam',
          username: 'testuser',
          scrapingStatus: 'PENDING',
        },
      ];

      apiService.registerTrackers.mockResolvedValue(mockTrackersResponse);

      await command.onRegister([interaction] as SlashCommandContext);

      expect(interaction.deferReply).toHaveBeenCalledWith({
        ephemeral: true,
      });
      expect(apiService.registerTrackers).toHaveBeenCalledWith(
        '111111111111111111',
        [
          'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        ],
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
      expect(editCall.embeds[0].data.title).toBe(
        '✅ Trackers Registered Successfully',
      );
    });

    it('should successfully register multiple trackers', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        {
          url1: 'https://rocketleague.tracker.network/rocket-league/profile/steam/user1/overview',
          url2: 'https://rocketleague.tracker.network/rocket-league/profile/steam/user2/overview',
          url3: 'https://rocketleague.tracker.network/rocket-league/profile/steam/user3/overview',
          url4: 'https://rocketleague.tracker.network/rocket-league/profile/steam/user4/overview',
        },
      );

      const mockTrackersResponse = [
        {
          url: 'https://rocketleague.tracker.network/rocket-league/profile/steam/user1/overview',
          platform: 'steam',
          username: 'user1',
          scrapingStatus: 'PENDING',
        },
        {
          url: 'https://rocketleague.tracker.network/rocket-league/profile/steam/user2/overview',
          platform: 'steam',
          username: 'user2',
          scrapingStatus: 'PENDING',
        },
        {
          url: 'https://rocketleague.tracker.network/rocket-league/profile/steam/user3/overview',
          platform: 'steam',
          username: 'user3',
          scrapingStatus: 'PENDING',
        },
        {
          url: 'https://rocketleague.tracker.network/rocket-league/profile/steam/user4/overview',
          platform: 'steam',
          username: 'user4',
          scrapingStatus: 'PENDING',
        },
      ];

      apiService.registerTrackers.mockResolvedValue(mockTrackersResponse);

      await command.onRegister([interaction] as SlashCommandContext);

      expect(apiService.registerTrackers).toHaveBeenCalledWith(
        '111111111111111111',
        expect.arrayContaining([
          'https://rocketleague.tracker.network/rocket-league/profile/steam/user1/overview',
          'https://rocketleague.tracker.network/rocket-league/profile/steam/user2/overview',
          'https://rocketleague.tracker.network/rocket-league/profile/steam/user3/overview',
          'https://rocketleague.tracker.network/rocket-league/profile/steam/user4/overview',
        ]),
        expect.any(Object),
        '123456789012345678',
        'test-token',
      );
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.description).toContain('4 tracker(s)');
    });

    it('should filter out empty and whitespace-only URLs', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        {
          url1: 'https://rocketleague.tracker.network/rocket-league/profile/steam/user1/overview',
          url2: '',
          url3: '   ',
          url4: null,
        },
      );

      const mockTrackersResponse = [
        {
          url: 'https://rocketleague.tracker.network/rocket-league/profile/steam/user1/overview',
          platform: 'steam',
          username: 'user1',
          scrapingStatus: 'PENDING',
        },
      ];

      apiService.registerTrackers.mockResolvedValue(mockTrackersResponse);

      await command.onRegister([interaction] as SlashCommandContext);

      expect(apiService.registerTrackers).toHaveBeenCalledWith(
        '111111111111111111',
        [
          'https://rocketleague.tracker.network/rocket-league/profile/steam/user1/overview',
        ],
        expect.any(Object),
        '123456789012345678',
        'test-token',
      );
    });

    it('should include user globalName and avatar when available', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        {
          url1: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        },
        {
          globalName: 'Test Global Name',
          avatar: 'avatar-hash',
        },
      );

      const mockTrackersResponse = [
        {
          url: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
          platform: 'steam',
          username: 'testuser',
          scrapingStatus: 'PENDING',
        },
      ];

      apiService.registerTrackers.mockResolvedValue(mockTrackersResponse);

      await command.onRegister([interaction] as SlashCommandContext);

      expect(apiService.registerTrackers).toHaveBeenCalledWith(
        '111111111111111111',
        expect.any(Array),
        {
          username: 'testuser',
          globalName: 'Test Global Name',
          avatar: 'avatar-hash',
        },
        '123456789012345678',
        'test-token',
      );
    });

    it('should handle tracker responses with missing optional fields', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        {
          url1: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        },
      );

      const mockTrackersResponse = [
        {
          url: undefined,
          platform: undefined,
          username: undefined,
          scrapingStatus: undefined,
        },
      ];

      apiService.registerTrackers.mockResolvedValue(mockTrackersResponse);

      await command.onRegister([interaction] as SlashCommandContext);

      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.fields).toBeDefined();
    });

    it('should handle AxiosError with response data message', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        {
          url1: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        },
      );

      const axiosError = new AxiosError('API Error');
      axiosError.response = {
        data: {
          message: 'Invalid tracker URL format',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      };
      apiService.registerTrackers.mockRejectedValue(axiosError);

      await command.onRegister([interaction] as SlashCommandContext);

      expect(interaction.deferReply).toHaveBeenCalled();
      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.title).toBe('❌ Registration Failed');
      expect(editCall.embeds[0].data.description).toBe(
        'Invalid tracker URL format',
      );
    });

    it('should handle AxiosError without response data message', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        {
          url1: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        },
      );

      const axiosError = new AxiosError('API Error');
      axiosError.response = {
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };
      apiService.registerTrackers.mockRejectedValue(axiosError);

      await command.onRegister([interaction] as SlashCommandContext);

      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.description).toBe(
        'An error occurred during registration. Please try again.',
      );
    });

    it('should handle generic Error with message', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        {
          url1: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        },
      );

      const error = new Error('Network timeout');
      apiService.registerTrackers.mockRejectedValue(error);

      await command.onRegister([interaction] as SlashCommandContext);

      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.description).toBe('Network timeout');
    });

    it('should handle unknown error type', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        {
          url1: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        },
      );

      apiService.registerTrackers.mockRejectedValue('String error');

      await command.onRegister([interaction] as SlashCommandContext);

      expect(interaction.editReply).toHaveBeenCalled();
      const editCall = (interaction.editReply as jest.Mock).mock.calls[0][0];
      expect(editCall.embeds[0].data.description).toBe(
        'An error occurred during registration. Please try again.',
      );
    });

    it('should handle null channelId', async () => {
      const interaction = createMockInteraction(
        '111111111111111111',
        'testuser',
        {
          url1: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
        },
        {
          channelId: null,
        },
      );

      const mockTrackersResponse = [
        {
          url: 'https://rocketleague.tracker.network/rocket-league/profile/steam/testuser/overview',
          platform: 'steam',
          username: 'testuser',
          scrapingStatus: 'PENDING',
        },
      ];

      apiService.registerTrackers.mockResolvedValue(mockTrackersResponse);

      await command.onRegister([interaction] as SlashCommandContext);

      expect(apiService.registerTrackers).toHaveBeenCalledWith(
        '111111111111111111',
        expect.any(Array),
        expect.any(Object),
        null,
        'test-token',
      );
    });
  });
});
