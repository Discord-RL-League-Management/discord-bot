import { DiscordMemberAdapter } from '../../src/adapters/discord-member.adapter';
import { memberFixtures } from '../fixtures/member.fixtures';

describe('DiscordMemberAdapter', () => {
  describe('toMemberData', () => {
    it('should convert GuildMember to MemberData', () => {
      // Arrange
      const mockMember = memberFixtures.createMockGuildMember();

      // Act
      const result = DiscordMemberAdapter.toMemberData(mockMember as any);

      // Assert
      expect(result.userId).toBe(mockMember.user.id);
      expect(result.username).toBe(mockMember.user.username);
      expect(result.guildId).toBe(mockMember.guild.id);
      expect(result.guildName).toBe(mockMember.guild.name);
      expect(result.roles).toEqual(['111111111111111111', '222222222222222222']);
    });

    it('should filter out @everyone role from roles array', () => {
      // Arrange
      const guildId = '987654321098765432';
      const mockMember = memberFixtures.createMockGuildMember({
        guild: { id: guildId },
        roles: {
          cache: new Map([
            [guildId, { id: guildId }], // @everyone role
            ['111111111111111111', { id: '111111111111111111' }],
            ['222222222222222222', { id: '222222222222222222' }],
          ]),
        },
      });

      // Act
      const result = DiscordMemberAdapter.toMemberData(mockMember as any);

      // Assert
      expect(result.roles).not.toContain(guildId); // @everyone should be filtered out
      expect(result.roles).toEqual(['111111111111111111', '222222222222222222']);
    });

    it('should handle member with no roles', () => {
      // Arrange
      const mockMember = memberFixtures.createMemberWithNoRoles();

      // Act
      const result = DiscordMemberAdapter.toMemberData(mockMember as any);

      // Assert
      expect(result.roles).toEqual([]);
    });
  });

  describe('toMemberUpdateData', () => {
    it('should convert old and new GuildMembers to MemberUpdateData', () => {
      // Arrange
      const { oldMember, newMember } = memberFixtures.createMemberUpdatePair();

      // Act
      const result = DiscordMemberAdapter.toMemberUpdateData(oldMember as any, newMember as any);

      // Assert
      expect(result.userId).toBe(newMember.user.id);
      expect(result.username).toBe(newMember.user.username);
      expect(result.guildId).toBe(newMember.guild.id);
      expect(result.guildName).toBe(newMember.guild.name);
      expect(result.oldRoles).toEqual(['111111111111111111', '222222222222222222']);
      expect(result.newRoles).toEqual(['111111111111111111', '222222222222222222', '333333333333333333']);
    });

    it('should handle members with same roles', () => {
      // Arrange
      const { oldMember, newMember } = memberFixtures.createMemberUpdateSameRoles();

      // Act
      const result = DiscordMemberAdapter.toMemberUpdateData(oldMember as any, newMember as any);

      // Assert
      expect(result.oldRoles).toEqual(result.newRoles);
      expect(result.oldRoles).toEqual(['111111111111111111', '222222222222222222']);
    });
  });
});
