import { Injectable } from '@nestjs/common';
import { On, Context } from 'necord';
import type { ContextOf } from 'necord';
import { GuildService } from './guild.service';

/**
 * GuildListeners - Handles Discord guild events using Necord decorators
 */
@Injectable()
export class GuildListeners {
  constructor(private readonly guildService: GuildService) {}

  @On('guildCreate')
  public async onGuildCreate(
    @Context() [guild]: ContextOf<'guildCreate'>,
  ): Promise<void> {
    await this.guildService.handleGuildJoin(guild);
  }

  @On('guildDelete')
  public async onGuildDelete(
    @Context() [guild]: ContextOf<'guildDelete'>,
  ): Promise<void> {
    await this.guildService.handleGuildLeave(guild);
  }
}
