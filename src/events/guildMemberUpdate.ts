import { Events } from 'discord.js';
import { MemberService } from '../services/member.service';

/**
 * Guild Member Update Event
 * Single Responsibility: Event handler delegation
 */
export function createGuildMemberUpdateEvent(memberService: MemberService) {
  return {
    name: Events.GuildMemberUpdate,
    execute: async (oldMember: any, newMember: any) => {
      await memberService.handleMemberUpdate(oldMember, newMember);
    },
  };
}
