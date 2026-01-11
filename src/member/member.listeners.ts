import { Injectable } from '@nestjs/common';
import { On, Context } from 'necord';
import type { ContextOf } from 'necord';
import { GuildMember } from 'discord.js';
import { MemberService } from './member.service';

/**
 * MemberListeners - Handles Discord member events using Necord decorators
 */
@Injectable()
export class MemberListeners {
  constructor(private readonly memberService: MemberService) {}

  @On('guildMemberAdd')
  public async onGuildMemberAdd(
    @Context() [member]: ContextOf<'guildMemberAdd'>,
  ): Promise<void> {
    await this.memberService.handleMemberJoin(member);
  }

  @On('guildMemberRemove')
  public async onGuildMemberRemove(
    @Context() [member]: ContextOf<'guildMemberRemove'>,
  ): Promise<void> {
    await this.memberService.handleMemberLeave(member);
  }

  @On('guildMemberUpdate')
  public async onGuildMemberUpdate(
    @Context() [oldMember, newMember]: ContextOf<'guildMemberUpdate'>,
  ): Promise<void> {
    // guildMemberUpdate always provides full GuildMember objects
    await this.memberService.handleMemberUpdate(
      oldMember as GuildMember,
      newMember,
    );
  }
}
