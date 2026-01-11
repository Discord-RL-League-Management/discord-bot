import { Injectable, Logger } from '@nestjs/common';
import { On, Once, Context } from 'necord';
import type { ContextOf } from 'necord';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  @Once('ready')
  public onReady(@Context() [client]: ContextOf<'ready'>) {
    if (!client.user) {
      this.logger.error(
        'Client user is null during ready event - this should not happen',
      );
      return;
    }
    const username = client.user.username ?? client.user.id ?? 'Unknown';
    this.logger.log(`Bot logged in as ${username}`);
    this.logger.log(`Bot is ready and online in Discord`);
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
