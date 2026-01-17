import { Injectable } from '@nestjs/common';
import { On, Once, Context } from 'necord';
import type { ContextOf } from 'necord';
import { GuildSyncService } from '../guild/guild-sync.service';
import { AppLogger } from '../common/app-logger.service';

@Injectable()
export class DiscordService {
  constructor(
    private readonly logger: AppLogger,
    private readonly guildSyncService: GuildSyncService,
  ) {
    this.logger.setContext(DiscordService.name);
  }

  @Once('clientReady')
  public async onReady(@Context() [client]: ContextOf<'clientReady'>) {
    if (!client.user) {
      this.logger.error(
        'Client user is null during clientReady event - this should not happen',
      );
      return;
    }
    const username = client.user.username ?? client.user.id ?? 'Unknown';
    this.logger.log(`Bot logged in as ${username}`);
    this.logger.log(`Bot is ready and online in Discord`);

    // Sync existing guilds with database
    try {
      this.logger.log('Starting guild sync...');
      const syncResult = await this.guildSyncService.syncAllGuilds(client);
      this.logger.log(
        `Guild sync complete: ${syncResult.synced}/${syncResult.total} guilds synced${syncResult.failed > 0 ? `, ${syncResult.failed} failed` : ''}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Guild sync failed:', errorMessage);
      // Don't throw - sync failure shouldn't prevent bot from running
    }
  }

  @On('warn')
  public onWarn(@Context() [message]: ContextOf<'warn'>) {
    this.logger.warn(`Discord client warning: ${message}`);
  }

  @On('error')
  public onError(@Context() [error]: ContextOf<'error'>) {
    this.logger.error(`Discord client error:`, error);
  }
}
