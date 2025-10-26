// Mock axios with factory function for CommonJS
const mockPost = jest.fn();
const mockDelete = jest.fn();
const mockPatch = jest.fn();

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: mockPost,
    delete: mockDelete,
    patch: mockPatch,
    interceptors: {
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

import { APIClient } from '../src/client';

describe('APIClient Guild Methods', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    apiClient = new APIClient();
    jest.clearAllMocks();
  });

  describe('createGuild', () => {
    it('should send a POST request to /internal/guilds with guild data', async () => {
      // Arrange
      const guildData = {
        id: '123456789',
        name: 'Test Guild',
        icon: 'icon_hash',
        ownerId: '987654321',
        memberCount: 100,
      };
      const mockResponse = { data: { ...guildData, createdAt: new Date().toISOString() } };
      mockPost.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.createGuild(guildData);

      // Assert
      expect(mockPost).toHaveBeenCalledWith('/internal/guilds', guildData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors and throw', async () => {
      // Arrange
      const guildData = {
        id: '123',
        name: 'Test',
        ownerId: '456',
        memberCount: 10
      };
      const mockError = new Error('API Error');
      mockPost.mockRejectedValue(mockError);

      // Act & Assert
      await expect(apiClient.createGuild(guildData)).rejects.toThrow();
    });
  });

  describe('removeGuild', () => {
    it('should send a DELETE request to /internal/guilds/:id', async () => {
      // Arrange
      const guildId = '123456789';
      const mockResponse = { data: { id: guildId, isActive: false } };
      mockDelete.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.removeGuild(guildId);

      // Assert
      expect(mockDelete).toHaveBeenCalledWith(`/internal/guilds/${guildId}`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors and throw', async () => {
      // Arrange
      const guildId = '123';
      const mockError = new Error('API Error');
      mockDelete.mockRejectedValue(mockError);

      // Act & Assert
      await expect(apiClient.removeGuild(guildId)).rejects.toThrow();
    });
  });

  describe('createGuildMember', () => {
    it('should send a POST request to /internal/guilds/:id/members with member data', async () => {
      // Arrange
      const memberData = {
        userId: 'user1',
        guildId: 'guild1',
        username: 'testuser',
        roles: ['member']
      };
      const mockResponse = { data: { ...memberData, id: 'memberId' } };
      mockPost.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.createGuildMember(memberData);

      // Assert
      expect(mockPost).toHaveBeenCalledWith(`/internal/guilds/${memberData.guildId}/members`, memberData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateGuildMember', () => {
    it('should send a PATCH request to /internal/guilds/:id/members/:userId with update data', async () => {
      // Arrange
      const userId = 'user1';
      const guildId = 'guild1';
      const updateData = { roles: ['admin'] };
      const mockResponse = { data: { userId, guildId, ...updateData } };
      mockPatch.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.updateGuildMember(userId, guildId, updateData);

      // Assert
      expect(mockPatch).toHaveBeenCalledWith(`/internal/guilds/${guildId}/members/${userId}`, updateData);
      expect(result).toEqual(mockResponse.data);
    });
  });
});