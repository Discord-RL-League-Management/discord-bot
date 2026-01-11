import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
  ForbiddenException,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { ChatInputCommandInteraction } from 'discord.js';

/**
 * CooldownInterceptor - Prevents command spam by enforcing cooldown periods
 * Tracks cooldowns per user per command
 */
@Injectable()
export class CooldownInterceptor
  implements NestInterceptor, OnApplicationShutdown
{
  private readonly logger = new Logger(CooldownInterceptor.name);
  private readonly cooldowns = new Map<string, number>();
  private readonly cooldownDuration = 3000; // 3 seconds default cooldown

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const interaction = this.getInteraction(context);
    if (!interaction) {
      // Not a Discord interaction, skip cooldown check
      return next.handle();
    }

    const cooldownKey = this.getCooldownKey(interaction);
    const now = Date.now();
    const cooldownEnd = this.cooldowns.get(cooldownKey);

    if (cooldownEnd && now < cooldownEnd) {
      const remaining = ((cooldownEnd - now) / 1000).toFixed(1);
      this.logger.debug(
        `Cooldown active for user ${interaction.user.id} on command ${interaction.commandName}: ${remaining}s remaining`,
      );

      if (interaction.deferred || interaction.replied) {
        interaction
          .followUp({
            content: `⏱️ Please wait ${remaining} seconds before using this command again.`,
            ephemeral: true,
          })
          .catch((err) => {
            this.logger.error('Failed to send cooldown message:', err);
          });
      } else {
        interaction
          .reply({
            content: `⏱️ Please wait ${remaining} seconds before using this command again.`,
            ephemeral: true,
          })
          .catch((err) => {
            this.logger.error('Failed to send cooldown message:', err);
          });
      }

      return throwError(() => new ForbiddenException('Command is on cooldown'));
    }

    this.cooldowns.set(cooldownKey, now + this.cooldownDuration);

    // Clean up old cooldowns periodically (optional optimization)
    if (this.cooldowns.size > 1000) {
      this.cleanupCooldowns(now);
    }

    return next.handle();
  }

  private getInteraction(
    context: ExecutionContext,
  ): ChatInputCommandInteraction | null {
    const args = context.getArgs();
    if (args && args.length > 0) {
      const firstArg = args[0] as unknown;
      if (
        firstArg &&
        typeof firstArg === 'object' &&
        'commandName' in firstArg &&
        'user' in firstArg
      ) {
        return firstArg as ChatInputCommandInteraction;
      }
    }
    return null;
  }

  private getCooldownKey(interaction: ChatInputCommandInteraction): string {
    return `${interaction.user.id}:${interaction.commandName}`;
  }

  private cleanupCooldowns(now: number): void {
    let cleaned = 0;
    for (const [key, endTime] of this.cooldowns.entries()) {
      if (now >= endTime) {
        this.cooldowns.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired cooldowns`);
    }
  }

  /**
   * Cleanup cooldowns on application shutdown
   * NestJS lifecycle hook - guaranteed to run during graceful shutdown
   */
  onApplicationShutdown(): void {
    const size = this.cooldowns.size;
    this.cooldowns.clear();
    if (size > 0) {
      this.logger.debug(`Cleaned up ${size} cooldown entries on shutdown`);
    }
  }
}
