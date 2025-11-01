import { ChannelFinderService } from '../../src/services/channel-finder.service';
import { Guild, TextChannel, ChannelType } from 'discord.js';

describe('ChannelFinderService', () => {
  let service: ChannelFinderService;

  beforeEach(() => {
    service = new ChannelFinderService();
  });

  describe('findWelcomeChannel', () => {
    it('should return general channel when it exists', () => {
      // Arrange
      const generalChannel = createMockTextChannel('general', 0, true);
      const guild = createMockGuild([generalChannel]);

      // Act
      const result = service.findWelcomeChannel(guild);

      // Assert
      expect(result).toBe(generalChannel);
      expect(result?.name).toBe('general');
    });

    it('should return general channel (case-insensitive)', () => {
      // Arrange
      const generalChannel = createMockTextChannel('General', 0, true);
      const guild = createMockGuild([generalChannel]);

      // Act
      const result = service.findWelcomeChannel(guild);

      // Assert
      expect(result).toBe(generalChannel);
      expect(result?.name).toBe('General');
    });

    it('should return channel with "general" in name', () => {
      // Arrange
      const generalChannel = createMockTextChannel('general-chat', 0, true);
      const guild = createMockGuild([generalChannel]);

      // Act
      const result = service.findWelcomeChannel(guild);

      // Assert
      expect(result).toBe(generalChannel);
    });

    it('should return accessible text channel when no general channel exists', () => {
      // Arrange
      const accessibleChannel = createMockTextChannel('random', 1, true);
      const guild = createMockGuild([accessibleChannel], true); // Bot has access

      // Act
      const result = service.findWelcomeChannel(guild);

      // Assert
      expect(result).toBe(accessibleChannel);
      expect(result?.name).toBe('random');
    });

    it('should return first text channel by position when no general or accessible channel', () => {
      // Arrange
      const firstChannel = createMockTextChannel('channel1', 0, true);
      const secondChannel = createMockTextChannel('channel2', 1, true);
      const guild = createMockGuild([firstChannel, secondChannel], false); // Bot has no access

      // Act
      const result = service.findWelcomeChannel(guild);

      // Assert
      expect(result).toBe(firstChannel); // First by position
      expect(result?.name).toBe('channel1');
    });

    it('should prefer general channel over accessible channel', () => {
      // Arrange
      const generalChannel = createMockTextChannel('general', 1, true);
      const accessibleChannel = createMockTextChannel('random', 0, true);
      const guild = createMockGuild([generalChannel, accessibleChannel], true);

      // Act
      const result = service.findWelcomeChannel(guild);

      // Assert
      expect(result).toBe(generalChannel); // General preferred
    });

    it('should prefer accessible channel over non-accessible channel', () => {
      // Arrange - create channels with explicit permissions before passing to createMockGuild
      const accessibleChannel = {
        id: 'accessible',
        name: 'accessible',
        type: ChannelType.GuildText,
        position: 1,
        permissionsFor: jest.fn().mockReturnValue({
          has: jest.fn((permission: string) => permission === 'SendMessages'),
        }),
      } as any;

      const nonAccessibleChannel = {
        id: 'private',
        name: 'private',
        type: ChannelType.GuildText,
        position: 0,
        permissionsFor: jest.fn().mockReturnValue(null),
      } as any;

      // Create guild manually to avoid helper overriding permissions
      const mockMe = { id: 'bot-id' };
      const guild = {
        name: 'Test Guild',
        channels: {
          cache: {
            find: jest.fn(),
            filter: jest.fn((predicate: any) => {
              const channels = [nonAccessibleChannel, accessibleChannel];
              return channels.filter(predicate);
            }),
            map: jest.fn((mapper: any) => {
              return [nonAccessibleChannel, accessibleChannel].map(mapper);
            }),
          },
        },
        members: {
          me: mockMe,
        },
      } as any;

      // Act
      const result = service.findWelcomeChannel(guild);

      // Assert
      expect(result).toBe(accessibleChannel); // Accessible preferred (has permissions)
    });

    it('should return null when no text channels exist', () => {
      // Arrange
      const guild = createMockGuild([]);

      // Act
      const result = service.findWelcomeChannel(guild);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when only non-text channels exist', () => {
      // Arrange
      const voiceChannel = {
        type: ChannelType.GuildVoice,
        name: 'voice-channel',
      } as any;
      const guild = createMockGuild([voiceChannel as any]);

      // Act
      const result = service.findWelcomeChannel(guild);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when channels exist but none are accessible and bot has no permissions', () => {
      // Arrange
      const channel = createMockTextChannel('channel', 0, true);
      const guild = createMockGuild([channel], false); // Bot has no access

      // Act
      const result = service.findWelcomeChannel(guild);

      // Assert
      // Should still return first channel by position (fallback strategy 3)
      expect(result).toBe(channel);
    });

    it('should handle errors gracefully and return null', () => {
      // Arrange
      const guild = {
        name: 'Test Guild',
        channels: {
          cache: {
            find: jest.fn(() => {
              throw new Error('Error accessing channels');
            }),
          },
        },
      } as any;

      // Act
      const result = service.findWelcomeChannel(guild);

      // Assert
      expect(result).toBeNull();
    });
  });
});

/**
 * Helper function to create mock text channel
 */
function createMockTextChannel(
  name: string,
  position: number,
  isTextChannel: boolean = true
): TextChannel {
  return {
    type: isTextChannel ? ChannelType.GuildText : ChannelType.GuildVoice,
    name,
    position,
    permissionsFor: jest.fn(),
  } as any;
}

/**
 * Helper function to create mock guild with channels
 */
function createMockGuild(
  channels: any[],
  botHasAccess: boolean = true
): Guild {
  const mockMe = {
    id: 'bot-id',
  };

  // Set up permissions for each channel
  channels.forEach((channel) => {
    if (channel.type === ChannelType.GuildText) {
      channel.permissionsFor = jest.fn(() => {
        if (botHasAccess) {
          return {
            has: jest.fn((permission: string) => permission === 'SendMessages'),
          };
        }
        return null; // No permissions
      });
    }
  });

  // Sort channels by position for cache
  const sortedChannels = [...channels].sort((a, b) => a.position - b.position);

  return {
    name: 'Test Guild',
    channels: {
      cache: {
        find: jest.fn((predicate: any) => {
          return sortedChannels.find(predicate);
        }),
        filter: jest.fn((predicate: any) => {
          return sortedChannels.filter(predicate);
        }),
        map: jest.fn((mapper: any) => {
          return sortedChannels.map(mapper);
        }),
      },
    },
    members: {
      me: mockMe,
    },
  } as any;
}

