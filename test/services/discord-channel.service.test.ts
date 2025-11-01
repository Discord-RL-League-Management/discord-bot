import { DiscordChannelService } from '../../src/services/discord-channel.service';
import { DiscordMessageService } from '../../src/services/discord-message.service';
import { ChannelFinderService } from '../../src/services/channel-finder.service';
import { ConfigService } from '../../src/services/config.service';
import { Guild, TextChannel } from 'discord.js';

describe('DiscordChannelService', () => {
  let service: DiscordChannelService;
  let mockMessageService: jest.Mocked<DiscordMessageService>;
  let mockChannelFinder: jest.Mocked<ChannelFinderService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockMessageService = {
      createWelcomeEmbed: jest.fn().mockReturnValue({
        data: { title: 'Welcome', description: 'Test' },
      }),
    } as any;

    mockChannelFinder = {
      findWelcomeChannel: jest.fn(),
    } as any;

    mockConfigService = {
      get dashboardUrl() { return undefined; },
    } as any;

    service = new DiscordChannelService(mockMessageService, mockChannelFinder, mockConfigService);
  });

  describe('trySendWelcomeMessage', () => {
    it('should return true when message is sent successfully', async () => {
      // Arrange
      const mockChannel = {
        name: 'general',
        send: jest.fn().mockResolvedValue({}),
      } as any;

      const mockGuild = { name: 'Test Guild' } as any;

      mockChannelFinder.findWelcomeChannel.mockReturnValue(mockChannel as TextChannel);

      // Act
      const result = await service.trySendWelcomeMessage(mockGuild);

      // Assert
      expect(result).toBe(true);
      expect(mockChannel.send).toHaveBeenCalled();
    });

    it('should return false when no suitable channel is found', async () => {
      // Arrange
      const mockGuild = { name: 'Test Guild' } as any;

      mockChannelFinder.findWelcomeChannel.mockReturnValue(null);

      // Act
      const result = await service.trySendWelcomeMessage(mockGuild);

      // Assert
      expect(result).toBe(false);
      // Should not throw error
    });

    it('should return false when channel does not support sending messages', async () => {
      // Arrange
      const mockChannel = {
        name: 'general',
        send: undefined, // Channel doesn't support sending
      } as any;

      const mockGuild = { name: 'Test Guild' } as any;

      mockChannelFinder.findWelcomeChannel.mockReturnValue(mockChannel as TextChannel);

      // Act
      const result = await service.trySendWelcomeMessage(mockGuild);

      // Assert
      expect(result).toBe(false);
      // Should not throw error
    });

    it('should return false when channel send fails', async () => {
      // Arrange
      const mockChannel = {
        name: 'general',
        send: jest.fn().mockRejectedValue(new Error('Send failed')),
      } as any;

      const mockGuild = { name: 'Test Guild' } as any;

      mockChannelFinder.findWelcomeChannel.mockReturnValue(mockChannel as TextChannel);

      // Act
      const result = await service.trySendWelcomeMessage(mockGuild);

      // Assert
      expect(result).toBe(false);
      // Should not throw error
    });

    it('should return false when channel finder throws error', async () => {
      // Arrange
      const mockGuild = { name: 'Test Guild' } as any;

      mockChannelFinder.findWelcomeChannel.mockImplementation(() => {
        throw new Error('Channel finder error');
      });

      // Act
      const result = await service.trySendWelcomeMessage(mockGuild);

      // Assert
      expect(result).toBe(false);
      // Should not throw error
    });

    it('should call createWelcomeEmbed when sending message', async () => {
      // Arrange
      const mockChannel = {
        name: 'general',
        send: jest.fn().mockResolvedValue({}),
      } as any;

      const mockGuild = { name: 'Test Guild' } as any;

      mockChannelFinder.findWelcomeChannel.mockReturnValue(mockChannel as TextChannel);

      // Act
      await service.trySendWelcomeMessage(mockGuild);

      // Assert
      expect(mockMessageService.createWelcomeEmbed).toHaveBeenCalled();
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          embeds: expect.any(Array),
        })
      );
    });

    it('should not throw error even when all operations fail', async () => {
      // Arrange
      const mockGuild = { name: 'Test Guild' } as any;

      mockChannelFinder.findWelcomeChannel.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      // Act & Assert
      await expect(service.trySendWelcomeMessage(mockGuild)).resolves.toBe(false);
      // Should not throw
    });

    it('should pass dashboard URL to createWelcomeEmbed when configured', async () => {
      // Arrange
      const mockChannel = {
        name: 'general',
        send: jest.fn().mockResolvedValue({}),
      } as any;

      const mockGuild = { name: 'Test Guild' } as any;
      Object.defineProperty(mockConfigService, 'dashboardUrl', {
        get: () => 'https://dashboard.example.com',
        configurable: true
      });

      mockChannelFinder.findWelcomeChannel.mockReturnValue(mockChannel as TextChannel);

      // Act
      await service.trySendWelcomeMessage(mockGuild);

      // Assert
      expect(mockMessageService.createWelcomeEmbed).toHaveBeenCalledWith('https://dashboard.example.com');
    });
  });
});

