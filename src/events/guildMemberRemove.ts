import { Events } from 'discord.js';
import { MemberService } from '../services/member.service';

/**
 * Guild Member Remove Event
 * Single Responsibility: Event handler delegation
 */
export function createGuildMemberRemoveEvent(memberService: MemberService) {
  return {
    name: Events.GuildMemberRemove,
    execute: async (member: any) => {
      await memberService.handleMemberLeave(member);
    },
  };
}
