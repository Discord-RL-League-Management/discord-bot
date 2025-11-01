import { GuildSyncService } from '../../src/services/guild-sync.service';
import { ApiService } from '../../src/services/api.service';
import { Client, Guild } from 'discord.js';

describe('GuildSyncService', () => {
  let service: GuildSyncService;
  let mockApiService: jest.Mocked<ApiService>;

  beforeEach(() => {
    mockApiService = {
      upsertGuild: jest.fn(),
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
      mockApiService.upsertGuild.mockResolvedValue({});

      // Act
      const result = await service.syncAllGuilds(mockClient);

      // Assert
      expect(result.total).toBe(3);
      expect(result.synced).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockApiService.upsertGuild).toHaveBeenCalledTimes(3);
    });

    it('should return correct summary when some guilds fail', async () => {
      // Arrange
      const guild1 = createMockGuild('guild1', 'Guild 1');
      const guild2 = createMockGuild('guild2', 'Guild 2');
      const guild3 = createMockGuild('guild3', 'Guild 3');

      const mockClient = createMockClient([guild1, guild2, guild3]);
      const syncError = new Error('Sync failed');
      mockApiService.upsertGuild
        .mockResolvedValueOnce({}) // guild1 succeeds
        .mockRejectedValueOnce(syncError) // guild2 fails
        .mockResolvedValueOnce({}); // guild3 succeeds

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
      mockApiService.upsertGuild.mockRejectedValue(syncError);

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
      expect(mockApiService.upsertGuild).not.toHaveBeenCalled();
    });

    it('should process all guilds even when one fails (error isolation)', async () => {
      // Arrange
      const guild1 = createMockGuild('guild1', 'Guild 1');
      const guild2 = createMockGuild('guild2', 'Guild 2');
      const guild3 = createMockGuild('guild3', 'Guild 3');

      const mockClient = createMockClient([guild1, guild2, guild3]);
      mockApiService.upsertGuild
        .mockResolvedValueOnce({}) // guild1 succeeds
        .mockRejectedValueOnce(new Error('Guild 2 error')) // guild2 fails
        .mockResolvedValueOnce({}); // guild3 succeeds

      // Act
      const result = await service.syncAllGuilds(mockClient);

      // Assert
      // All three should be processed
      expect(mockApiService.upsertGuild).toHaveBeenCalledTimes(3);
      // guild1 and guild3 should succeed despite guild2 failure
      expect(result.synced).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('should call upsertGuild with correct guild data for each guild', async () => {
      // Arrange
      const guild1 = createMockGuild('guild1', 'Guild 1', 'icon1', 'owner1', 100);
      const guild2 = createMockGuild('guild2', 'Guild 2', 'icon2', 'owner2', 200);

      const mockClient = createMockClient([guild1, guild2]);
      mockApiService.upsertGuild.mockResolvedValue({});

      // Act
      await service.syncAllGuilds(mockClient);

      // Assert
      expect(mockApiService.upsertGuild).toHaveBeenCalledWith({
        id: 'guild1',
        name: 'Guild 1',
        icon: 'icon1',
        ownerId: 'owner1',
        memberCount: 100,
      });
      expect(mockApiService.upsertGuild).toHaveBeenCalledWith({
        id: 'guild2',
        name: 'Guild 2',
        icon: 'icon2',
        ownerId: 'owner2',
        memberCount: 200,
      });
    });
  });

  describe('syncGuild', () => {
    it('should successfully sync a single guild', async () => {
      // Arrange
      const guild = createMockGuild('guild1', 'Guild 1', null); // Pass null to test undefined conversion
      mockApiService.upsertGuild.mockResolvedValue({ id: 'guild1' });

      // Act
      await service.syncGuild(guild);

      // Assert
      expect(mockApiService.upsertGuild).toHaveBeenCalledWith({
        id: 'guild1',
        name: 'Guild 1',
        icon: undefined,
        ownerId: 'owner123',
        memberCount: 0,
      });
      // Should not throw
    });

    it('should throw error when sync fails', async () => {
      // Arrange
      const guild = createMockGuild('guild1', 'Guild 1');
      const syncError = new Error('Sync failed');
      mockApiService.upsertGuild.mockRejectedValue(syncError);

      // Act & Assert
      await expect(service.syncGuild(guild)).rejects.toThrow('Sync failed');
    });

    it('should handle guild with null icon', async () => {
      // Arrange
      const guild = createMockGuild('guild1', 'Guild 1', null);
      mockApiService.upsertGuild.mockResolvedValue({});

      // Act
      await service.syncGuild(guild);

      // Assert
      expect(mockApiService.upsertGuild).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'guild1',
          name: 'Guild 1',
          icon: undefined, // null should become undefined
          ownerId: 'owner123',
          memberCount: 0,
        })
      );
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
  } as any;
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

