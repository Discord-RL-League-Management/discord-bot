describe('APIClient Guild Methods - Black Box Testing', () => {
  // Test the public interface without mocking internal implementation
  let apiClient: any;

  beforeEach(() => {
    // Create a real APIClient instance but mock the axios calls
    const axios = require('axios');
    const mockAxiosInstance = {
      post: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn(),
        },
      },
    };
    
    jest.spyOn(axios, 'create').mockReturnValue(mockAxiosInstance);
    
    // Import after mocking
    const { APIClient } = require('../src/client');
    apiClient = new APIClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGuild method', () => {
    it('should accept valid guild data and return success', async () => {
      // Arrange
      const guildData = {
        id: '123456789',
        name: 'Test Guild',
        icon: 'icon_hash',
        ownerId: '987654321',
        memberCount: 150,
      };
      
      const mockResponse = { data: { id: guildData.id, name: guildData.name } };
      const axios = require('axios');
      const mockInstance = axios.create();
      mockInstance.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.createGuild(guildData);

      // Assert - Verify input/output behavior
      expect(mockInstance.post).toHaveBeenCalledWith('/internal/guilds', guildData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle missing optional fields', async () => {
      // Arrange
      const guildData = {
        id: '123456789',
        name: 'Test Guild',
        ownerId: '987654321',
        memberCount: 150,
        // icon is optional
      };
      
      const mockResponse = { data: guildData };
      const axios = require('axios');
      const mockInstance = axios.create();
      mockInstance.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.createGuild(guildData);

      // Assert
      expect(result).toEqual(guildData);
    });
  });

  describe('removeGuild method', () => {
    it('should accept guild ID and make DELETE request', async () => {
      // Arrange
      const guildId = '123456789';
      const mockResponse = { data: { id: guildId, isActive: false } };
      const axios = require('axios');
      const mockInstance = axios.create();
      mockInstance.delete.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.removeGuild(guildId);

      // Assert
      expect(mockInstance.delete).toHaveBeenCalledWith(`/internal/guilds/${guildId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createGuildMember method', () => {
    it('should accept member data and make POST request', async () => {
      // Arrange
      const memberData = {
        userId: '111111111',
        guildId: '222222222',
        username: 'testuser',
        roles: ['role1', 'role2'],
      };
      
      const mockResponse = { data: memberData };
      const axios = require('axios');
      const mockInstance = axios.create();
      mockInstance.post.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.createGuildMember(memberData);

      // Assert
      expect(mockInstance.post).toHaveBeenCalledWith(
        `/internal/guilds/${memberData.guildId}/members`,
        memberData
      );
      expect(result).toEqual(memberData);
    });
  });

  describe('updateGuildMember method', () => {
    it('should accept update data and make PATCH request', async () => {
      // Arrange
      const userId = '111111111';
      const guildId = '222222222';
      const updateData = {
        username: 'newusername',
        roles: ['role3'],
      };
      
      const mockResponse = { data: { userId, guildId, ...updateData } };
      const axios = require('axios');
      const mockInstance = axios.create();
      mockInstance.patch.mockResolvedValue(mockResponse);

      // Act
      const result = await apiClient.updateGuildMember(userId, guildId, updateData);

      // Assert
      expect(mockInstance.patch).toHaveBeenCalledWith(
        `/internal/guilds/${guildId}/members/${userId}`,
        updateData
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});



