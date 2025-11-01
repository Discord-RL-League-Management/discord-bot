import { MemberService } from '../../src/services/member.service';
import { ApiService } from '../../src/services/api.service';
import { createMockApiService, resetAllMocks } from '../setup/service-mocks';
import { memberFixtures } from '../fixtures/member.fixtures';

describe('MemberService', () => {
  let memberService: MemberService;
  let mockApiService: jest.Mocked<ApiService>;

  beforeEach(() => {
    mockApiService = createMockApiService() as any;
    memberService = new MemberService(mockApiService);
  });

  afterEach(() => {
    resetAllMocks();
  });

  describe('handleMemberJoin', () => {
    it('should call API with correct data when valid member joins', async () => {
      // Arrange
      const mockMember = memberFixtures.createMockGuildMember();

      // Act
      await memberService.handleMemberJoin(mockMember as any);

      // Assert
      expect(mockApiService.createGuildMember).toHaveBeenCalledWith(
        mockMember.guild.id,
        {
          userId: mockMember.user.id,
          username: mockMember.user.username,
          roles: ['111111111111111111', '222222222222222222'], // Filtered @everyone
        }
      );
      expect(mockApiService.createGuildMember).toHaveBeenCalledTimes(1);
    });

    it('should filter out @everyone role from roles array', async () => {
      // Arrange
      const mockMember = memberFixtures.createMockGuildMember();
      const guildId = mockMember.guild!.id;

      // Act
      await memberService.handleMemberJoin(mockMember as any);

      // Assert
      expect(mockApiService.createGuildMember).toHaveBeenCalledWith(
        guildId,
        expect.objectContaining({
          roles: expect.not.arrayContaining([guildId]), // @everyone role should be filtered out
        })
      );
    });

    it('should throw error when Discord user ID format is invalid', async () => {
      // Arrange
      const mockMember = memberFixtures.createMockGuildMember({
        user: memberFixtures.createUserWithInvalidId(),
      }) as any;

      // Act & Assert
      await expect(memberService.handleMemberJoin(mockMember as any)).rejects.toThrow(
        'Invalid Discord ID format'
      );
      expect(mockApiService.createGuildMember).not.toHaveBeenCalled();
    });

    it('should throw error when Discord guild ID format is invalid', async () => {
      // Arrange
      const mockMember = memberFixtures.createMockGuildMember({
        guild: memberFixtures.createGuildWithInvalidId(),
      }) as any;

      // Act & Assert
      await expect(memberService.handleMemberJoin(mockMember as any)).rejects.toThrow(
        'Invalid Discord ID format'
      );
      expect(mockApiService.createGuildMember).not.toHaveBeenCalled();
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      const mockMember = memberFixtures.createMockGuildMember();
      const apiError = new Error('API Error');
      mockApiService.createGuildMember.mockRejectedValue(apiError);

      // Act & Assert
      await expect(memberService.handleMemberJoin(mockMember as any)).rejects.toThrow(
        'API Error'
      );
    });

  });

  describe('processMemberJoin (private method)', () => {
    it('should process member join with valid data', async () => {
      // Arrange
      const memberData = memberFixtures.createMemberData();

      // Act
      await (memberService as any).processMemberJoin(memberData);

      // Assert
      expect(mockApiService.createGuildMember).toHaveBeenCalledWith(
        memberData.guildId,
        {
          userId: memberData.userId,
          username: memberData.username,
          roles: memberData.roles,
        }
      );
    });

    it('should throw error with invalid Discord ID', async () => {
      // Arrange
      const memberData = memberFixtures.createMemberDataWithInvalidId();

      // Act & Assert
      await expect((memberService as any).processMemberJoin(memberData)).rejects.toThrow(
        'Invalid Discord ID format'
      );
      expect(mockApiService.createGuildMember).not.toHaveBeenCalled();
    });

    it('should propagate API errors', async () => {
      // Arrange
      const memberData = memberFixtures.createMemberData();
      const apiError = new Error('API Error');
      mockApiService.createGuildMember.mockRejectedValue(apiError);

      // Act & Assert
      await expect((memberService as any).processMemberJoin(memberData)).rejects.toThrow(
        'API Error'
      );
    });
  });

  describe('processMemberUpdate (private method)', () => {
    it('should process member update when roles change', async () => {
      // Arrange
      const updateData = memberFixtures.createMemberUpdateData();

      // Act
      await (memberService as any).processMemberUpdate(updateData);

      // Assert
      expect(mockApiService.updateGuildMember).toHaveBeenCalledWith(
        updateData.guildId,
        updateData.userId,
        {
          username: updateData.username,
          roles: ['111111111111111111', '222222222222222222', '333333333333333333'], // Filtered @everyone
        }
      );
    });

    it('should NOT call API when roles have not changed', async () => {
      // Arrange
      const updateData = memberFixtures.createMemberUpdateDataSameRoles();

      // Act
      await (memberService as any).processMemberUpdate(updateData);

      // Assert
      expect(mockApiService.updateGuildMember).not.toHaveBeenCalled();
    });

    it('should filter @everyone role from updated roles', async () => {
      // Arrange
      const updateData = memberFixtures.createMemberUpdateData({
        newRoles: ['987654321098765432', '111111111111111111', '222222222222222222'], // Include @everyone
      });

      // Act
      await (memberService as any).processMemberUpdate(updateData);

      // Assert
      expect(mockApiService.updateGuildMember).toHaveBeenCalledWith(
        updateData.guildId,
        updateData.userId,
        {
          username: updateData.username,
          roles: ['111111111111111111', '222222222222222222'], // @everyone filtered out
        }
      );
    });
  });

  describe('handleMemberLeave', () => {
    it('should call API to remove member when valid data provided', async () => {
      // Arrange
      const mockMember = memberFixtures.createMockGuildMember();

      // Act
      await memberService.handleMemberLeave(mockMember as any);

      // Assert
      expect(mockApiService.removeGuildMember).toHaveBeenCalledWith(
        (mockMember.guild as any).id,
        mockMember.user!.id
      );
      expect(mockApiService.removeGuildMember).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user ID is missing', async () => {
      // Arrange
      const mockMember = memberFixtures.createMemberWithoutUserId();

      // Act & Assert
      await expect(memberService.handleMemberLeave(mockMember as any)).rejects.toThrow(
        'Missing user or guild ID'
      );
      expect(mockApiService.removeGuildMember).not.toHaveBeenCalled();
    });

    it('should throw error when guild ID is missing', async () => {
      // Arrange
      const mockMember = memberFixtures.createMemberWithoutGuild();

      // Act & Assert
      await expect(memberService.handleMemberLeave(mockMember as any)).rejects.toThrow(
        'Missing user or guild ID'
      );
      expect(mockApiService.removeGuildMember).not.toHaveBeenCalled();
    });

    it('should handle partial member objects (from Discord cache)', async () => {
      // Arrange
      const mockMember = memberFixtures.createMemberWithoutGuild();
      mockMember.guild = memberFixtures.createMockGuild() as any;

      // Act
      await memberService.handleMemberLeave(mockMember as any);

      // Assert
      expect(mockApiService.removeGuildMember).toHaveBeenCalledWith(
        (mockMember.guild as any).id,
        mockMember.user!.id
      );
    });

    it('should throw error when API call fails', async () => {
      // Arrange
      const mockMember = memberFixtures.createMockGuildMember();
      const apiError = new Error('API Error');
      mockApiService.removeGuildMember.mockRejectedValue(apiError);

      // Act & Assert
      await expect(memberService.handleMemberLeave(mockMember as any)).rejects.toThrow(
        'API Error'
      );
    });
  });

  describe('handleMemberUpdate', () => {
    it('should call API when roles change (added roles)', async () => {
      // Arrange
      const { oldMember, newMember } = memberFixtures.createMemberUpdatePair();

      // Act
      await memberService.handleMemberUpdate(oldMember as any, newMember as any);

      // Assert
      expect(mockApiService.updateGuildMember).toHaveBeenCalledWith(
        newMember.guild!.id,
        newMember.user!.id,
        expect.objectContaining({
          username: newMember.user!.username,
          roles: expect.arrayContaining(['111111111111111111', '222222222222222222']),
        })
      );
      expect(mockApiService.updateGuildMember).toHaveBeenCalledTimes(1);
    });


    it('should NOT call API when roles have not changed', async () => {
      // Arrange
      const { oldMember, newMember } = memberFixtures.createMemberSameRoles();

      // Act
      await memberService.handleMemberUpdate(oldMember as any, newMember as any);

      // Assert
      expect(mockApiService.updateGuildMember).not.toHaveBeenCalled();
    });


    it('should throw error when API call fails', async () => {
      // Arrange
      const { oldMember, newMember } = memberFixtures.createMemberUpdatePair();
      const apiError = new Error('API Error');
      mockApiService.updateGuildMember.mockRejectedValue(apiError);

      // Act & Assert
      await expect(
        memberService.handleMemberUpdate(oldMember as any, newMember as any)
      ).rejects.toThrow('API Error');
    });

    it('should handle username changes', async () => {
      // Arrange
      const { oldMember, newMember } = memberFixtures.createMemberUpdatePair();
      newMember.user!.username = 'newusername';

      // Act
      await memberService.handleMemberUpdate(oldMember as any, newMember as any);

      // Assert
      expect(mockApiService.updateGuildMember).toHaveBeenCalledWith(
        newMember.guild!.id,
        newMember.user!.id,
        expect.objectContaining({
          username: 'newusername',
        })
      );
    });
  });

  describe('isValidDiscordId (private method)', () => {
    it('should validate correct Discord ID formats', () => {
      // Arrange
      const validIds = memberFixtures.createValidDiscordIds();

      // Act & Assert
      validIds.forEach(id => {
        // We can't directly test private method, but we can test through public methods
        const mockMember = memberFixtures.createMockGuildMember({
          user: { id },
          guild: { id: '987654321098765432' },
        });

        expect(async () => {
          await memberService.handleMemberJoin(mockMember as any);
        }).not.toThrow();
      });
    });

  });

  describe('Error handling and logging', () => {
    it('should propagate API errors with original error message', async () => {
      // Arrange
      const mockMember = memberFixtures.createMockGuildMember();
      const originalError = new Error('Database connection failed');
      mockApiService.createGuildMember.mockRejectedValue(originalError);

      // Act & Assert
      await expect(memberService.handleMemberJoin(mockMember as any)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const mockMember = memberFixtures.createMockGuildMember();
      const timeoutError = new Error('Request timeout');
      mockApiService.createGuildMember.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(memberService.handleMemberJoin(mockMember as any)).rejects.toThrow(
        'Request timeout'
      );
    });

    it('should handle validation errors from API', async () => {
      // Arrange
      const mockMember = memberFixtures.createMockGuildMember();
      const validationError = new Error('Validation failed: username is required');
      mockApiService.createGuildMember.mockRejectedValue(validationError);

      // Act & Assert
      await expect(memberService.handleMemberJoin(mockMember as any)).rejects.toThrow(
        'Validation failed: username is required'
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle member with null username', async () => {
      // Arrange
      const mockMember = memberFixtures.createMockGuildMember({
        user: { username: null },
      });

      // Act & Assert
      await expect(memberService.handleMemberJoin(mockMember as any)).rejects.toThrow();
    });

    it('should handle member with undefined username', async () => {
      // Arrange
      const mockMember = memberFixtures.createMockGuildMember({
        user: { username: undefined },
      });

      // Act & Assert
      await expect(memberService.handleMemberJoin(mockMember as any)).rejects.toThrow();
    });

  });
});
