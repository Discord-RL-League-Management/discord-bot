import { GuildService } from '../../src/services/guild.service';
import { ApiService } from '../../src/services/api.service';
import { DiscordChannelService } from '../../src/services/discord-channel.service';
import { NotificationService } from '../../src/services/notification.service';
import { ErrorClassificationService } from '../../src/services/error-classification.service';

describe('GuildService', () => {
  let guildService: GuildService;
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

    guildService = new GuildService(
      mockApiService,
      mockChannelService,
      mockNotificationService,
      mockErrorClassification
    );
  });

  describe('handleGuildJoin', () => {
    it('should successfully handle guild join without errors', async () => {
      // Arrange
      const mockGuild = {
        id: '123',
        name: 'Test Guild',
        icon: null,
        ownerId: 'owner123',
        memberCount: 10,
      } as any;

      mockApiService.upsertGuild.mockResolvedValue({ id: '123' });

      // Act & Assert
      await expect(guildService.handleGuildJoin(mockGuild)).resolves.not.toThrow();
    });

    it('should not notify owner on conflict error (409)', async () => {
      // Arrange
      const mockGuild = {
        id: '123',
        name: 'Test Guild',
        ownerId: 'owner123',
      } as any;

      const conflictError = { statusCode: 409, message: 'Conflict' };
      mockApiService.upsertGuild.mockRejectedValue(conflictError);
      mockErrorClassification.isConflictError.mockImplementation((err: any) => err?.statusCode === 409);

      // Act
      await guildService.handleGuildJoin(mockGuild);

      // Assert
      expect(mockNotificationService.notifyGuildOwner).not.toHaveBeenCalled();
    });

    it('should complete successfully on conflict error', async () => {
      // Arrange
      const mockGuild = {
        id: '123',
        name: 'Test Guild',
        ownerId: 'owner123',
      } as any;

      const conflictError = { statusCode: 409, message: 'Conflict' };
      mockApiService.upsertGuild.mockRejectedValue(conflictError);
      mockErrorClassification.isConflictError.mockImplementation((err: any) => err?.statusCode === 409);

      // Act & Assert
      await expect(guildService.handleGuildJoin(mockGuild)).resolves.not.toThrow();
    });

    it('should notify owner on permanent error (400)', async () => {
      // Arrange
      const mockGuild = {
        id: '123',
        name: 'Test Guild',
        ownerId: 'owner123',
      } as any;

      const permanentError = { statusCode: 400, message: 'Bad Request' };
      mockApiService.upsertGuild.mockRejectedValue(permanentError);
      
      // Set up mocks to correctly classify the error
      mockErrorClassification.isConflictError.mockImplementation((err: any) => {
        return err && err.statusCode === 409;
      });
      mockErrorClassification.isPermanentError.mockImplementation((err: any) => {
        if (!err) return false;
        if (err.statusCode === 409) return false;
        const code = err.statusCode;
        return code >= 400 && code < 500 && code !== 429;
      });

      // Act & Assert
      try {
        await guildService.handleGuildJoin(mockGuild);
        fail('Expected handleGuildJoin to throw');
      } catch (error) {
        // Expected to throw
      }
      expect(mockNotificationService.notifyGuildOwner).toHaveBeenCalledWith(
        mockGuild,
        'There was an error setting up the bot. Please contact support.'
      );
    });

    it('should not notify owner on transient error (500)', async () => {
      // Arrange
      const mockGuild = {
        id: '123',
        name: 'Test Guild',
        ownerId: 'owner123',
      } as any;

      const transientError = { statusCode: 500, message: 'Server Error' };
      mockApiService.upsertGuild.mockRejectedValue(transientError);
      mockErrorClassification.isConflictError.mockImplementation((err: any) => {
        return err && err.statusCode === 409;
      });
      mockErrorClassification.isPermanentError.mockImplementation((err: any) => {
        if (!err) return false;
        if (err.statusCode === 409) return false;
        const code = err.statusCode;
        return code >= 400 && code < 500 && code !== 429;
      });

      // Act & Assert
      try {
        await guildService.handleGuildJoin(mockGuild);
        fail('Expected handleGuildJoin to throw');
      } catch (error) {
        // Expected to throw
      }
      expect(mockNotificationService.notifyGuildOwner).not.toHaveBeenCalled();
    });

    it('should complete successfully even when welcome message fails', async () => {
      // Arrange
      const mockGuild = {
        id: '123',
        name: 'Test Guild',
        icon: null,
        ownerId: 'owner123',
        memberCount: 10,
      } as any;

      mockApiService.upsertGuild.mockResolvedValue({ id: '123' });
      mockChannelService.trySendWelcomeMessage.mockResolvedValue(false); // Welcome fails

      // Act & Assert
      await expect(guildService.handleGuildJoin(mockGuild)).resolves.not.toThrow();
      // Guild creation should succeed despite welcome message failure
    });
  });

  describe('handleGuildLeave', () => {
    it('should remove guild from API', async () => {
      const mockGuild = {
        id: '123',
        name: 'Test Guild',
      } as any;

      await guildService.handleGuildLeave(mockGuild);

      expect(mockApiService.removeGuild).toHaveBeenCalledWith('123');
    });
  });
});

