import { Test, TestingModule } from '@nestjs/testing';
import { Client, Guild, Collection, GuildMember, Role, User } from 'discord.js';
import { GuildSyncService } from './guild-sync.service';
import { ApiService } from '../api/api.service';
import { AppLogger } from '../common/app-logger.service';

describe('GuildSyncService', () => {
  let service: GuildSyncService;
  let module: TestingModule;
  let apiService: jest.Mocked<ApiService>;
  let loggerSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  const mockApiService = {
    syncGuildWithMembersAndRoles: jest.fn(),
  };

  const createMockRole = (
    id: string,
    name: string,
    hasAdmin: boolean,
  ): Role => {
    return {
      id,
      name,
      permissions: {
        has: jest.fn().mockReturnValue(hasAdmin),
      },
    } as unknown as Role;
  };

  const createMockMember = (
    userId: string,
    username: string,
    isBot: boolean,
    roleIds: string[],
    nickname?: string,
  ): GuildMember => {
    const rolesCache = new Collection<string, Role>();
    roleIds.forEach((roleId) => {
      rolesCache.set(roleId, { id: roleId } as Role);
    });

    return {
      user: {
        id: userId,
        username,
        bot: isBot,
      } as User,
      nickname: nickname || null,
      roles: {
        cache: rolesCache,
      },
    } as unknown as GuildMember;
  };

  const createMockGuild = (
    id: string,
    name: string,
    members: GuildMember[],
    roles: Role[],
  ): Guild => {
    const membersCollection = new Collection<string, GuildMember>();
    members.forEach((member) => {
      membersCollection.set(member.user.id, member);
    });

    const rolesCollection = new Collection<string, Role>();
    roles.forEach((role) => {
      rolesCollection.set(role.id, role);
    });

    return {
      id,
      name,
      icon: 'test-icon',
      ownerId: '111111111111111111',
      memberCount: members.length,
      members: {
        fetch: jest.fn().mockResolvedValue(membersCollection),
      },
      roles: {
        fetch: jest.fn().mockResolvedValue(rolesCollection),
        cache: rolesCollection,
      },
    } as unknown as Guild;
  };

  const createMockClient = (guilds: Guild[]): Client => {
    const guildsCollection = new Collection<string, Guild>();
    guilds.forEach((guild) => {
      guildsCollection.set(guild.id, guild);
    });

    return {
      guilds: {
        cache: guildsCollection,
      },
    } as unknown as Client;
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    mockApiService.syncGuildWithMembersAndRoles.mockClear();

    module = await Test.createTestingModule({
      providers: [
        GuildSyncService,
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

    service = module.get<GuildSyncService>(GuildSyncService);
    apiService = module.get(ApiService);

    loggerSpy = {
      log: jest.spyOn(mockLogger, 'log'),
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

  describe('syncAllGuilds', () => {
    it('should successfully sync all guilds when API calls succeed', async () => {
      const member1 = createMockMember(
        '222222222222222222',
        'user1',
        false,
        ['333333333333333333'],
        'User1Nick',
      );
      const adminRole = createMockRole('333333333333333333', 'Admin', true);
      const guild1 = createMockGuild(
        '123456789012345678',
        'Guild 1',
        [member1],
        [adminRole],
      );
      const guild2 = createMockGuild('987654321098765432', 'Guild 2', [], []);
      const mockClient = createMockClient([guild1, guild2]);

      apiService.syncGuildWithMembersAndRoles.mockResolvedValue({
        synced: true,
      });

      const result = await service.syncAllGuilds(mockClient);

      expect(result.total).toBe(2);
      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(apiService.syncGuildWithMembersAndRoles).toHaveBeenCalledTimes(2);
    });

    it('should log starting sync message', async () => {
      const guild1 = createMockGuild('123456789012345678', 'Guild 1', [], []);
      const mockClient = createMockClient([guild1]);
      apiService.syncGuildWithMembersAndRoles.mockResolvedValue({});

      await service.syncAllGuilds(mockClient);

      expect(loggerSpy.log).toHaveBeenCalledWith('Starting sync for 1 guilds');
    });

    it('should handle partial failures gracefully', async () => {
      const guild1 = createMockGuild('123456789012345678', 'Guild 1', [], []);
      const guild2 = createMockGuild('987654321098765432', 'Guild 2', [], []);
      const mockClient = createMockClient([guild1, guild2]);

      apiService.syncGuildWithMembersAndRoles
        .mockResolvedValueOnce({ synced: true })
        .mockRejectedValueOnce(new Error('API error'));

      const result = await service.syncAllGuilds(mockClient);

      expect(result.total).toBe(2);
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].guildId).toBe('987654321098765432');
    });

    it('should handle empty guild list', async () => {
      const mockClient = createMockClient([]);

      const result = await service.syncAllGuilds(mockClient);

      expect(result.total).toBe(0);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(0);
      expect(apiService.syncGuildWithMembersAndRoles).not.toHaveBeenCalled();
      expect(loggerSpy.log).toHaveBeenCalledWith('Starting sync for 0 guilds');
    });

    it('should continue syncing when one guild fails', async () => {
      const guild1 = createMockGuild('111111111111111111', 'Guild 1', [], []);
      const guild2 = createMockGuild('222222222222222222', 'Guild 2', [], []);
      const guild3 = createMockGuild('333333333333333333', 'Guild 3', [], []);
      const mockClient = createMockClient([guild1, guild2, guild3]);

      apiService.syncGuildWithMembersAndRoles
        .mockResolvedValueOnce({ synced: true })
        .mockRejectedValueOnce(new Error('Middle guild failed'))
        .mockResolvedValueOnce({ synced: true });

      const result = await service.syncAllGuilds(mockClient);

      expect(result.total).toBe(3);
      expect(result.synced).toBe(2);
      expect(result.failed).toBe(1);
      expect(apiService.syncGuildWithMembersAndRoles).toHaveBeenCalledTimes(3);
    });
  });

  describe('syncGuild', () => {
    it('should sync guild with members and admin roles successfully', async () => {
      const humanMember = createMockMember(
        '222222222222222222',
        'humanuser',
        false,
        ['333333333333333333'],
        'Human Nick',
      );
      const botMember = createMockMember(
        '444444444444444444',
        'botuser',
        true,
        [],
      );
      const adminRole = createMockRole('333333333333333333', 'Admin', true);
      const everyoneRole = createMockRole(
        '123456789012345678',
        '@everyone',
        false,
      );

      const guild = createMockGuild(
        '123456789012345678',
        'Test Guild',
        [humanMember, botMember],
        [adminRole, everyoneRole],
      );

      apiService.syncGuildWithMembersAndRoles.mockResolvedValue({
        synced: true,
      });

      await service.syncGuild(guild);

      expect(apiService.syncGuildWithMembersAndRoles).toHaveBeenCalledTimes(1);
      expect(apiService.syncGuildWithMembersAndRoles).toHaveBeenCalledWith(
        '123456789012345678',
        {
          id: '123456789012345678',
          name: 'Test Guild',
          icon: 'test-icon',
          ownerId: '111111111111111111',
          memberCount: 2,
        },
        [
          {
            userId: '222222222222222222',
            username: 'humanuser',
            nickname: 'Human Nick',
            roles: ['333333333333333333'],
          },
        ],
        {
          admin: [{ id: '333333333333333333', name: 'Admin' }],
        },
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Syncing guild: Test Guild (123456789012345678)',
      );
    });

    it('should filter out bot members', async () => {
      const botMember = createMockMember('111111111111111111', 'bot', true, []);
      const guild = createMockGuild(
        '123456789012345678',
        'Test Guild',
        [botMember],
        [],
      );

      apiService.syncGuildWithMembersAndRoles.mockResolvedValue({
        synced: true,
      });

      await service.syncGuild(guild);

      expect(apiService.syncGuildWithMembersAndRoles).toHaveBeenCalledWith(
        '123456789012345678',
        expect.any(Object),
        [], // Empty members array - bot filtered out
        undefined, // No admin roles
      );
    });

    it('should filter out @everyone role from member roles', async () => {
      const member = createMockMember(
        '222222222222222222',
        'user',
        false,
        ['123456789012345678', '333333333333333333'], // Includes guild ID (@everyone)
      );
      const guild = createMockGuild(
        '123456789012345678',
        'Test Guild',
        [member],
        [],
      );

      apiService.syncGuildWithMembersAndRoles.mockResolvedValue({
        synced: true,
      });

      await service.syncGuild(guild);

      expect(apiService.syncGuildWithMembersAndRoles).toHaveBeenCalledWith(
        '123456789012345678',
        expect.any(Object),
        [
          expect.objectContaining({
            roles: ['333333333333333333'], // @everyone role filtered out
          }),
        ],
        undefined,
      );
    });

    it('should not include roles data when no admin roles exist', async () => {
      const regularRole = createMockRole(
        '333333333333333333',
        'Regular',
        false,
      );
      const guild = createMockGuild(
        '123456789012345678',
        'Test Guild',
        [],
        [regularRole],
      );

      apiService.syncGuildWithMembersAndRoles.mockResolvedValue({
        synced: true,
      });

      await service.syncGuild(guild);

      expect(apiService.syncGuildWithMembersAndRoles).toHaveBeenCalledWith(
        '123456789012345678',
        expect.any(Object),
        [],
        undefined, // No admin roles
      );
    });

    it('should throw error when API call fails', async () => {
      const guild = createMockGuild('123456789012345678', 'Test Guild', [], []);
      const error = new Error('API sync failed');

      apiService.syncGuildWithMembersAndRoles.mockRejectedValue(error);

      await expect(service.syncGuild(guild)).rejects.toThrow('API sync failed');

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Error syncing guild Test Guild (123456789012345678):',
        'API sync failed',
      );
    });

    it('should handle non-Error rejection', async () => {
      const guild = createMockGuild('123456789012345678', 'Test Guild', [], []);

      apiService.syncGuildWithMembersAndRoles.mockRejectedValue('String error');

      await expect(service.syncGuild(guild)).rejects.toBe('String error');

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Error syncing guild Test Guild (123456789012345678):',
        'Unknown error',
      );
    });

    it('should handle member with no nickname', async () => {
      const member = createMockMember('222222222222222222', 'user', false, []);
      const guild = createMockGuild(
        '123456789012345678',
        'Test Guild',
        [member],
        [],
      );

      apiService.syncGuildWithMembersAndRoles.mockResolvedValue({
        synced: true,
      });

      await service.syncGuild(guild);

      expect(apiService.syncGuildWithMembersAndRoles).toHaveBeenCalledWith(
        '123456789012345678',
        expect.any(Object),
        [
          expect.objectContaining({
            nickname: undefined,
          }),
        ],
        undefined,
      );
    });
  });
});
