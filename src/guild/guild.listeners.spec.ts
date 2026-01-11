import { Test, TestingModule } from '@nestjs/testing';
import { Guild } from 'discord.js';
import { GuildListeners } from './guild.listeners';
import { GuildService } from './guild.service';

describe('GuildListeners', () => {
  let listeners: GuildListeners;
  let module: TestingModule;
  let guildService: jest.Mocked<GuildService>;

  const mockGuildService = {
    handleGuildJoin: jest.fn(),
    handleGuildLeave: jest.fn(),
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
    mockGuildService.handleGuildJoin.mockClear();
    mockGuildService.handleGuildLeave.mockClear();

    module = await Test.createTestingModule({
      providers: [
        GuildListeners,
        {
          provide: GuildService,
          useValue: mockGuildService,
        },
      ],
    }).compile();

    listeners = module.get<GuildListeners>(GuildListeners);
    guildService = module.get(GuildService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await module.close();
  });

  it('should be defined', () => {
    expect(listeners).toBeDefined();
  });

  describe('onGuildCreate', () => {
    it('should call guildService.handleGuildJoin with correct guild', async () => {
      const mockGuild = createMockGuild();
      mockGuildService.handleGuildJoin.mockResolvedValue(undefined);

      await listeners.onGuildCreate([mockGuild]);

      expect(guildService.handleGuildJoin).toHaveBeenCalledTimes(1);
      expect(guildService.handleGuildJoin).toHaveBeenCalledWith(mockGuild);
    });

    it('should propagate errors from guildService.handleGuildJoin', async () => {
      const mockGuild = createMockGuild();
      const error = new Error('API error');
      mockGuildService.handleGuildJoin.mockRejectedValue(error);

      await expect(listeners.onGuildCreate([mockGuild])).rejects.toThrow(
        'API error',
      );

      expect(guildService.handleGuildJoin).toHaveBeenCalledTimes(1);
    });
  });

  describe('onGuildDelete', () => {
    it('should call guildService.handleGuildLeave with correct guild', async () => {
      const mockGuild = createMockGuild();
      mockGuildService.handleGuildLeave.mockResolvedValue(undefined);

      await listeners.onGuildDelete([mockGuild]);

      expect(guildService.handleGuildLeave).toHaveBeenCalledTimes(1);
      expect(guildService.handleGuildLeave).toHaveBeenCalledWith(mockGuild);
    });

    it('should propagate errors from guildService.handleGuildLeave', async () => {
      const mockGuild = createMockGuild();
      const error = new Error('API error');
      mockGuildService.handleGuildLeave.mockRejectedValue(error);

      await expect(listeners.onGuildDelete([mockGuild])).rejects.toThrow(
        'API error',
      );

      expect(guildService.handleGuildLeave).toHaveBeenCalledTimes(1);
    });
  });
});
