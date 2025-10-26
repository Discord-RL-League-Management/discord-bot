// Mock the APIClient before any imports
const mockCreateGuild = jest.fn();
const mockRemoveGuild = jest.fn();

jest.mock('../src/client', () => ({
  APIClient: jest.fn().mockImplementation(() => ({
    createGuild: mockCreateGuild,
    removeGuild: mockRemoveGuild,
  })),
}));

describe('Guild Event Handlers - Black Box Testing', () => {
  // Mock console methods to capture output
  const consoleSpy = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateGuild.mockClear();
    mockRemoveGuild.mockClear();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('guildCreate event behavior', () => {
    it('should log guild join message', async () => {
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
      };

      // Get the mocked APIClient
      const { APIClient } = require('../src/client');
      const mockInstance = new APIClient();
      mockInstance.createGuild.mockResolvedValue({});

      // Act
      const { guildCreateEvent } = await import('../src/events/guildCreate');
      await guildCreateEvent.execute(mockGuild as any);

      // Assert - Verify behavior through console output
      expect(consoleSpy.log).toHaveBeenCalledWith('Bot joined guild: Test Guild (123456789)');
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const mockGuild = {
        id: '123456789',
        name: 'Test Guild',
        ownerId: '987654321',
        memberCount: 150,
        channels: { cache: { find: jest.fn() } },
        fetchOwner: jest.fn().mockResolvedValue({
          send: jest.fn().mockResolvedValue({}),
        }),
      };

      // Configure mock to throw error
      mockCreateGuild.mockRejectedValue(new Error('API Error'));

      // Act
      const { guildCreateEvent } = await import('../src/events/guildCreate');
      await guildCreateEvent.execute(mockGuild as any);

      // Assert - Verify error handling behavior
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Error initializing guild 123456789:',
        expect.any(Error)
      );
    });
  });

  describe('guildDelete event behavior', () => {
    it('should log guild leave message', async () => {
      // Arrange
      const mockGuild = {
        id: '123456789',
        name: 'Test Guild',
      };

      // Configure mock to succeed
      mockRemoveGuild.mockResolvedValue({});

      // Act
      const { guildDeleteEvent } = await import('../src/events/guildDelete');
      await guildDeleteEvent.execute(mockGuild as any);

      // Assert - Verify behavior through console output
      expect(consoleSpy.log).toHaveBeenCalledWith('Bot left guild: Test Guild (123456789)');
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const mockGuild = {
        id: '123456789',
        name: 'Test Guild',
      };

      // Configure mock to throw error
      mockRemoveGuild.mockRejectedValue(new Error('API Error'));

      // Act
      const { guildDeleteEvent } = await import('../src/events/guildDelete');
      await guildDeleteEvent.execute(mockGuild as any);

      // Assert - Verify error handling behavior
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '❌ Error handling guild leave 123456789:',
        expect.any(Error)
      );
    });
  });
});
