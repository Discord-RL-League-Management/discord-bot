import { GuildMember } from 'discord.js';
import { MemberData, MemberUpdateData } from '../interfaces/member-data.interface';

export class DiscordMemberAdapter {
  static toMemberData(member: GuildMember): MemberData {
    return {
      userId: member.user.id,
      username: member.user.username,
      nickname: member.nickname || undefined,
      guildId: member.guild.id,
      guildName: member.guild.name,
      roles: Array.from(member.roles.cache.keys())
        .filter(roleId => roleId !== member.guild.id) // Exclude @everyone
    };
  }

  static toMemberUpdateData(oldMember: GuildMember, newMember: GuildMember): MemberUpdateData {
    return {
      userId: newMember.user.id,
      username: newMember.user.username,
      nickname: newMember.nickname || undefined,
      guildId: newMember.guild.id,
      guildName: newMember.guild.name,
      oldRoles: Array.from(oldMember.roles.cache.keys()),
      newRoles: Array.from(newMember.roles.cache.keys())
    };
  }
}
