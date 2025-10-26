// Mock the APIClient with factory function for CommonJS
const mockCreateGuild = jest.fn();
const mockRemoveGuild = jest.fn();

jest.mock('../src/client', () => {
  return {
    APIClient: jest.fn().mockImplementation(() => ({
      createGuild: mockCreateGuild,
      removeGuild: mockRemoveGuild,
    })),
  };
});

import { APIClient } from '../src/client';

describe('Guild Event Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateGuild.mockClear();
    mockRemoveGuild.mockClear();
  });

  describe('guildCreate event', () => {
    it('should create guild in database when bot joins', async () => {
      // Arrange
      const mockGuild = {
        id: '123456789',
        name: 'Test Guild',
        icon: 'icon_hash',
        ownerId: '987654321',
        memberCount: 150,
        channels: {
          cache: {
            find: jest.fn().mockReturnValue({
              send: jest.fn().mockResolvedValue({}),
            }),
          },
        },
        fetchOwner: jest.fn().mockResolvedValue({
          send: jest.fn().mockResolvedValue({}),
        }),
      } as any;

      mockCreateGuild.mockResolvedValue({});

      // Act
      const { guildCreateEvent } = await import('../src/events/guildCreate');
      await guildCreateEvent.execute(mockGuild);

      // Assert
      expect(mockCreateGuild).toHaveBeenCalledWith({
        id: mockGuild.id,
        name: mockGuild.name,
        icon: mockGuild.icon,
        ownerId: mockGuild.ownerId,
        memberCount: mockGuild.memberCount,
      });
    });

    it('should handle API errors gracefully and DM guild owner', async () => {
      // Arrange
      const mockOwnerSend = jest.fn().mockResolvedValue({});
      const mockGuild = {
        id: '123456789',
        name: 'Test Guild',
        ownerId: '987654321',
        memberCount: 150,
        channels: { cache: { find: jest.fn() } },
        fetchOwner: jest.fn().mockResolvedValue({ send: mockOwnerSend }),
      } as any;

      mockCreateGuild.mockRejectedValue(new Error('API Error'));

      // Act
      const { guildCreateEvent } = await import('../src/events/guildCreate');
      await guildCreateEvent.execute(mockGuild);

      // Assert
      expect(mockGuild.fetchOwner).toHaveBeenCalled();
      expect(mockOwnerSend).toHaveBeenCalledWith(
        'There was an error setting up the bot. Please contact support.'
      );
    });

    it('should send welcome message to general channel', async () => {
      // Arrange
      const mockSend = jest.fn().mockResolvedValue({});
      const mockGuild = {
        id: '123456789',
        name: 'Test Guild',
        icon: 'icon_hash',
        ownerId: '987654321',
        memberCount: 150,
        channels: {
          cache: {
            find: jest.fn().mockReturnValue({
              send: mockSend,
            }),
          },
        },
        fetchOwner: jest.fn().mockResolvedValue({
          send: jest.fn().mockResolvedValue({}),
        }),
      } as any;

      mockCreateGuild.mockResolvedValue({});

      // Act
      const { guildCreateEvent } = await import('../src/events/guildCreate');
      await guildCreateEvent.execute(mockGuild);

      // Assert
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        embeds: expect.any(Array),
      }));
    });
  });

  describe('guildDelete event', () => {
    it('should remove guild from database when bot leaves', async () => {
      // Arrange
      const mockGuild = {
        id: '123456789',
        name: 'Test Guild',
      } as any;

      mockRemoveGuild.mockResolvedValue({});

      // Act
      const { guildDeleteEvent } = await import('../src/events/guildDelete');
      await guildDeleteEvent.execute(mockGuild);

      // Assert
      expect(mockRemoveGuild).toHaveBeenCalledWith(mockGuild.id);
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockGuild = {
        id: '123456789',
        name: 'Test Guild',
      } as any;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockRemoveGuild.mockRejectedValue(new Error('API Error'));

      // Act
      const { guildDeleteEvent } = await import('../src/events/guildDelete');
      await guildDeleteEvent.execute(mockGuild);

      // Assert
      expect(mockRemoveGuild).toHaveBeenCalledWith(mockGuild.id);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`❌ Error handling guild leave ${mockGuild.id}:`),
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
