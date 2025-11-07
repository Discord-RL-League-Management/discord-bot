import { GuildSyncService } from '../../src/services/guild-sync.service';
import { ApiService } from '../../src/services/api.service';
import { Client, Guild } from 'discord.js';

describe('GuildSyncService', () => {
  let service: GuildSyncService;
  let mockApiService: jest.Mocked<ApiService>;

  beforeEach(() => {
    mockApiService = {
      syncGuildWithMembers: jest.fn(),
    } as any;

    service = new GuildSyncService(mockApiService);
  });

  describe('syncAllGuilds', () => {
    it('should return correct summary when all guilds sync successfully', async () => {
      // Arrange
      const guild1 = createMockGuild('guild1', 'Guild 1');
      const guild2 = createMockGuild('guild2', 'Guild 2');
      const guild3 = createMockGuild('guild3', 'Guild 3');

      const mockClient = createMockClient([guild1, guild2, guild3]);
      mockApiService.syncGuildWithMembers.mockResolvedValue({ guild: {}, membersSynced: 0 });

      // Act
      const result = await service.syncAllGuilds(mockClient);

      // Assert
      expect(result.total).toBe(3);
      expect(result.synced).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockApiService.syncGuildWithMembers).toHaveBeenCalledTimes(3);
    });

    it('should return correct summary when some guilds fail', async () => {
      // Arrange
      const guild1 = createMockGuild('guild1', 'Guild 1');
      const guild2 = createMockGuild('guild2', 'Guild 2');
      const guild3 = createMockGuild('guild3', 'Guild 3');

      const mockClient = createMockClient([guild1, guild2, guild3]);
      const syncError = new Error('Sync failed');
      mockApiService.syncGuildWithMembers
        .mockResolvedValueOnce({ guild: {}, membersSynced: 0 }) // guild1 succeeds
        .mockRejectedValueOnce(syncError) // guild2 fails
        .mockResolvedValueOnce({ guild: {}, membersSynced: 0 }); // guild3 succeeds

      // Act
      const result = await service.syncAllGuilds(mockClient);

      // Assert
      expect(result.total).toBe(3);
      expect(result.synced).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        guildId: 'guild2',
        error: syncError,
      });
    });

    it('should return correct summary when all guilds fail', async () => {
      // Arrange
      const guild1 = createMockGuild('guild1', 'Guild 1');
      const guild2 = createMockGuild('guild2', 'Guild 2');

      const mockClient = createMockClient([guild1, guild2]);
      const syncError = new Error('Sync failed');
      mockApiService.syncGuildWithMembers.mockRejectedValue(syncError);

      // Act
      const result = await service.syncAllGuilds(mockClient);

      // Assert
      expect(result.total).toBe(2);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.errors).toHaveLength(2);
    });

    it('should return correct summary for empty guild list', async () => {
      // Arrange
      const mockClient = createMockClient([]);

      // Act
      const result = await service.syncAllGuilds(mockClient);

      // Assert
      expect(result.total).toBe(0);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockApiService.syncGuildWithMembers).not.toHaveBeenCalled();
    });

    it('should process all guilds even when one fails (error isolation)', async () => {
      // Arrange
      const guild1 = createMockGuild('guild1', 'Guild 1');
      const guild2 = createMockGuild('guild2', 'Guild 2');
      const guild3 = createMockGuild('guild3', 'Guild 3');

      const mockClient = createMockClient([guild1, guild2, guild3]);
      mockApiService.syncGuildWithMembers
        .mockResolvedValueOnce({ guild: {}, membersSynced: 0 }) // guild1 succeeds
        .mockRejectedValueOnce(new Error('Guild 2 error')) // guild2 fails
        .mockResolvedValueOnce({ guild: {}, membersSynced: 0 }); // guild3 succeeds

      // Act
      const result = await service.syncAllGuilds(mockClient);

      // Assert
      // All three should be processed
      expect(mockApiService.syncGuildWithMembers).toHaveBeenCalledTimes(3);
      // guild1 and guild3 should succeed despite guild2 failure
      expect(result.synced).toBe(2);
      expect(result.failed).toBe(1);
    });
  });

  describe('syncGuild', () => {
    it('should successfully sync a single guild with members atomically', async () => {
      // Arrange
      const guild = createMockGuild('guild1', 'Guild 1', null);
      const mockMembers = createMockMembers(2);
      guild.members = {
        fetch: jest.fn().mockResolvedValue(mockMembers),
      } as any;

      mockApiService.syncGuildWithMembers.mockResolvedValue({
        guild: { id: 'guild1' },
        membersSynced: 2,
      });

      // Act
      await service.syncGuild(guild);

      // Assert
      expect(guild.members.fetch).toHaveBeenCalledTimes(1);
      expect(mockApiService.syncGuildWithMembers).toHaveBeenCalledWith(
        'guild1',
        {
          id: 'guild1',
          name: 'Guild 1',
          icon: undefined,
          ownerId: 'owner123',
          memberCount: 0,
        },
        expect.arrayContaining([
          expect.objectContaining({
            userId: expect.any(String),
            username: expect.any(String),
            roles: expect.any(Array),
          }),
        ])
      );
      expect(mockApiService.syncGuildWithMembers).toHaveBeenCalledTimes(1);
    });

    it('should throw error when sync fails', async () => {
      // Arrange
      const guild = createMockGuild('guild1', 'Guild 1');
      const mockMembers = createMockMembers(1);
      guild.members = {
        fetch: jest.fn().mockResolvedValue(mockMembers),
      } as any;

      const syncError = new Error('Sync failed');
      mockApiService.syncGuildWithMembers.mockRejectedValue(syncError);

      // Act & Assert
      await expect(service.syncGuild(guild)).rejects.toThrow('Sync failed');
      expect(guild.members.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle guild with null icon', async () => {
      // Arrange
      const guild = createMockGuild('guild1', 'Guild 1', null);
      const mockMembers = createMockMembers(0);
      guild.members = {
        fetch: jest.fn().mockResolvedValue(mockMembers),
      } as any;

      mockApiService.syncGuildWithMembers.mockResolvedValue({
        guild: {},
        membersSynced: 0,
      });

      // Act
      await service.syncGuild(guild);

      // Assert
      expect(mockApiService.syncGuildWithMembers).toHaveBeenCalledWith(
        'guild1',
        expect.objectContaining({
          id: 'guild1',
          name: 'Guild 1',
          icon: undefined, // null should become undefined
          ownerId: 'owner123',
          memberCount: 0,
        }),
        []
      );
    });

    it('should filter out @everyone role from member roles', async () => {
      // Arrange
      const guild = createMockGuild('guild1', 'Guild 1');
      const mockMembers = createMockMembersWithRoles('guild1', [
        ['role1', 'role2'],
        ['role3', 'guild1'], // @everyone role (guild ID)
      ]);
      guild.members = {
        fetch: jest.fn().mockResolvedValue(mockMembers),
      } as any;

      mockApiService.syncGuildWithMembers.mockResolvedValue({
        guild: {},
        membersSynced: 2,
      });

      // Act
      await service.syncGuild(guild);

      // Assert
      expect(mockApiService.syncGuildWithMembers).toHaveBeenCalledWith(
        'guild1',
        expect.any(Object),
        expect.arrayContaining([
          { userId: expect.any(String), username: expect.any(String), roles: ['role1', 'role2'] },
          { userId: expect.any(String), username: expect.any(String), roles: ['role3'] }, // @everyone filtered
        ])
      );
    });

    it('should fetch all members from Discord once', async () => {
      // Arrange
      const guild = createMockGuild('guild1', 'Guild 1');
      const mockMembers = createMockMembers(5);
      guild.members = {
        fetch: jest.fn().mockResolvedValue(mockMembers),
      } as any;

      mockApiService.syncGuildWithMembers.mockResolvedValue({
        guild: {},
        membersSynced: 5,
      });

      // Act
      await service.syncGuild(guild);

      // Assert
      expect(guild.members.fetch).toHaveBeenCalledTimes(1);
      expect(mockApiService.syncGuildWithMembers).toHaveBeenCalledTimes(1);
      expect(mockApiService.syncGuildWithMembers).toHaveBeenCalledWith(
        'guild1',
        expect.any(Object),
        expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
          expect.any(Object),
          expect.any(Object),
          expect.any(Object),
        ])
      );
    });

    it('should handle guild with no members', async () => {
      // Arrange
      const guild = createMockGuild('guild1', 'Guild 1');
      const mockMembers = createMockMembers(0);
      guild.members = {
        fetch: jest.fn().mockResolvedValue(mockMembers),
      } as any;

      mockApiService.syncGuildWithMembers.mockResolvedValue({
        guild: {},
        membersSynced: 0,
      });

      // Act
      await service.syncGuild(guild);

      // Assert
      expect(mockApiService.syncGuildWithMembers).toHaveBeenCalledWith(
        'guild1',
        expect.any(Object),
        []
      );
    });

    it('should not use batching - single call with all members', async () => {
      // Arrange
      const guild = createMockGuild('guild1', 'Guild 1');
      const mockMembers = createMockMembers(500); // Large number of members
      guild.members = {
        fetch: jest.fn().mockResolvedValue(mockMembers),
      } as any;

      mockApiService.syncGuildWithMembers.mockResolvedValue({
        guild: {},
        membersSynced: 500,
      });

      // Act
      await service.syncGuild(guild);

      // Assert
      // Should make only ONE call with ALL members (no batching)
      expect(mockApiService.syncGuildWithMembers).toHaveBeenCalledTimes(1);
      const callArgs = mockApiService.syncGuildWithMembers.mock.calls[0];
      expect(callArgs[2]).toHaveLength(500); // All members in single call
    });
  });
});

/**
 * Helper function to create mock guild
 */
function createMockGuild(
  id: string,
  name: string,
  icon: string | null = 'icon_hash',
  ownerId: string = 'owner123',
  memberCount: number = 0
): Guild {
  return {
    id,
    name,
    icon,
    ownerId,
    memberCount,
    members: {
      fetch: jest.fn().mockResolvedValue(new Map()),
    },
  } as any;
}

/**
 * Helper function to create mock Discord members collection
 */
function createMockMembers(count: number): Map<string, any> {
  const members = new Map();
  for (let i = 0; i < count; i++) {
    const member = {
      user: {
        id: `user${i}`,
        username: `User${i}`,
      },
      roles: {
        cache: {
          keys: () => [`role${i}`],
        },
      },
    };
    members.set(`user${i}`, member);
  }
  return members;
}

/**
 * Helper function to create mock Discord members with specific roles
 */
function createMockMembersWithRoles(guildId: string, roleArrays: string[][]): Map<string, any> {
  const members = new Map();
  roleArrays.forEach((roles, index) => {
    const member = {
      user: {
        id: `user${index}`,
        username: `User${index}`,
      },
      roles: {
        cache: {
          keys: () => roles,
        },
      },
    };
    members.set(`user${index}`, member);
  });
  return members;
}

/**
 * Helper function to create mock Discord client with guilds
 */
function createMockClient(guilds: Guild[]): Client {
  return {
    guilds: {
      cache: {
        values: () => guilds.values(),
      },
    },
  } as any;
}

