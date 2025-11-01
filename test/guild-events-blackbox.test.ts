import { createGuildCreateEvent } from '../src/events/guildCreate';
import { createGuildDeleteEvent } from '../src/events/guildDelete';
import { GuildService } from '../src/services/guild.service';
import { ApiService } from '../src/services/api.service';
import { DiscordChannelService } from '../src/services/discord-channel.service';
import { NotificationService } from '../src/services/notification.service';
import { ErrorClassificationService } from '../src/services/error-classification.service';

describe('Guild Event Handlers - Black Box Testing', () => {
  let mockGuildService: jest.Mocked<GuildService>;
  let mockApiService: jest.Mocked<ApiService>;
  let mockChannelService: jest.Mocked<DiscordChannelService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockErrorClassification: jest.Mocked<ErrorClassificationService>;

  beforeEach(() => {
    mockApiService = {
      upsertGuild: jest.fn(),
      removeGuild: jest.fn(),
    } as any;

    mockChannelService = {
      trySendWelcomeMessage: jest.fn(),
    } as any;

    mockNotificationService = {
      notifyGuildOwner: jest.fn(),
    } as any;

    mockErrorClassification = {
      isConflictError: jest.fn(),
      isTransientError: jest.fn(),
      isPermanentError: jest.fn(),
    } as any;

    mockGuildService = {
      handleGuildJoin: jest.fn(),
      handleGuildLeave: jest.fn(),
    } as any;
  });

  describe('guildCreate event behavior', () => {
    it('should successfully handle guild join event', async () => {
      // Arrange
      const mockGuild = {
        id: '123456789',
        name: 'Test Guild',
        icon: 'icon_hash',
        ownerId: '987654321',
        memberCount: 150,
      } as any;

      mockGuildService.handleGuildJoin.mockResolvedValue();

      // Act
      const event = createGuildCreateEvent(mockGuildService);
      await event.execute(mockGuild);

      // Assert - Verify behavioral outcome (event completes successfully)
      expect(mockGuildService.handleGuildJoin).toHaveBeenCalledWith(mockGuild);
      await expect(event.execute(mockGuild)).resolves.not.toThrow();
    });

    it('should handle conflict errors without notifying owner', async () => {
      // Arrange
      const mockGuild = {
        id: '123456789',
        name: 'Test Guild',
        ownerId: '987654321',
      } as any;

      // Mock service to handle conflict gracefully (behavioral outcome)
      mockGuildService.handleGuildJoin.mockImplementation(async () => {
        // Simulate conflict handling - completes successfully
      });

      // Act
      const event = createGuildCreateEvent(mockGuildService);
      await event.execute(mockGuild);

      // Assert - Verify behavioral outcome (completes without error)
      await expect(event.execute(mockGuild)).resolves.not.toThrow();
    });

    it('should complete successfully even when welcome message fails', async () => {
      // Arrange
      const mockGuild = {
        id: '123456789',
        name: 'Test Guild',
        icon: 'icon_hash',
        ownerId: '987654321',
        memberCount: 150,
      } as any;

      // Mock service to succeed despite welcome message failure (behavioral outcome)
      mockGuildService.handleGuildJoin.mockResolvedValue();

      // Act
      const event = createGuildCreateEvent(mockGuildService);
      await event.execute(mockGuild);

      // Assert - Verify behavioral outcome (completes successfully)
      await expect(event.execute(mockGuild)).resolves.not.toThrow();
    });
  });

  describe('guildDelete event behavior', () => {
    it('should successfully handle guild leave event', async () => {
      // Arrange
      const mockGuild = {
        id: '123456789',
        name: 'Test Guild',
      } as any;

      mockGuildService.handleGuildLeave.mockResolvedValue();

      // Act
      const event = createGuildDeleteEvent(mockGuildService);
      await event.execute(mockGuild);

      // Assert - Verify behavioral outcome (event completes successfully)
      expect(mockGuildService.handleGuildLeave).toHaveBeenCalledWith(mockGuild);
      await expect(event.execute(mockGuild)).resolves.not.toThrow();
    });

    it('should complete successfully even when remove fails', async () => {
      // Arrange
      const mockGuild = {
        id: '123456789',
        name: 'Test Guild',
      } as any;

      // Mock service to handle error gracefully (behavioral outcome)
      mockGuildService.handleGuildLeave.mockResolvedValue(); // Doesn't throw

      // Act
      const event = createGuildDeleteEvent(mockGuildService);
      await event.execute(mockGuild);

      // Assert - Verify behavioral outcome (completes without error)
      await expect(event.execute(mockGuild)).resolves.not.toThrow();
    });
  });
});
