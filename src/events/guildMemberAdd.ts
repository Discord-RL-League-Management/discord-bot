import { Events } from 'discord.js';
import { MemberService } from '../services/member.service';

/**
 * Guild Member Add Event
 * Single Responsibility: Event handler delegation
 */
export function createGuildMemberAddEvent(memberService: MemberService) {
  return {
    name: Events.GuildMemberAdd,
    execute: async (member: any) => {
      await memberService.handleMemberJoin(member);
    },
  };
}
