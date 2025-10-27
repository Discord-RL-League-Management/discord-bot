import { GuildService } from '../../src/services/guild.service';
import { ApiService } from '../../src/services/api.service';
import { DiscordChannelService } from '../../src/services/discord-channel.service';
import { NotificationService } from '../../src/services/notification.service';

describe('GuildService', () => {
  let guildService: GuildService;
  let mockApiService: jest.Mocked<ApiService>;
  let mockChannelService: jest.Mocked<DiscordChannelService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  beforeEach(() => {
    mockApiService = {
      createGuild: jest.fn(),
      removeGuild: jest.fn(),
    } as any;

    mockChannelService = {
      sendWelcomeMessage: jest.fn(),
    } as any;

    mockNotificationService = {
      notifyGuildOwner: jest.fn(),
    } as any;

    guildService = new GuildService(
      mockApiService,
      mockChannelService,
      mockNotificationService
    );
  });

  describe('handleGuildJoin', () => {
    it('should create guild in API and send welcome message', async () => {
      const mockGuild = {
        id: '123',
        name: 'Test Guild',
        icon: null,
        ownerId: 'owner123',
        memberCount: 10,
      } as any;

      await guildService.handleGuildJoin(mockGuild);

      expect(mockApiService.createGuild).toHaveBeenCalledWith({
        id: '123',
        name: 'Test Guild',
        icon: undefined,
        ownerId: 'owner123',
        memberCount: 10,
      });
      expect(mockChannelService.sendWelcomeMessage).toHaveBeenCalledWith(mockGuild);
    });

    it('should notify owner on error', async () => {
      const mockGuild = {
        id: '123',
        name: 'Test Guild',
      } as any;

      mockApiService.createGuild.mockRejectedValue(new Error('API Error'));

      await expect(guildService.handleGuildJoin(mockGuild)).rejects.toThrow();
      expect(mockNotificationService.notifyGuildOwner).toHaveBeenCalled();
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

