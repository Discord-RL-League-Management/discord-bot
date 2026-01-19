import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { AppLogger } from '../../common/app-logger.service';
import { ConfigService } from '../../config/config.service';

/**
 * E2ERestrictionGuard - Guard that restricts commands to specific guild and channel for e2e testing
 * DEVELOPMENT ONLY - This guard will throw an error if used in production
 *
 * This guard is intended for IRL e2e testing during bot development.
 * It should NOT be used in production environments.
 *
 * Usage: @UseGuards(E2ERestrictionGuard)
 */
@Injectable()
export class E2ERestrictionGuard implements CanActivate {
  // E2E testing constants - Ascendancy League
  private readonly allowedGuildId = '1352451711431737394';
  private readonly allowedChannelId = '1384302923974053948';

  constructor(
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(E2ERestrictionGuard.name);

    // Prevent usage in production
    const nodeEnv = this.configService.getNodeEnv();
    if (nodeEnv === 'production') {
      throw new Error(
        'E2ERestrictionGuard is for development/e2e testing only and cannot be used in production. ' +
          'Remove this guard before deploying to production.',
      );
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const interaction = this.getInteraction(context);
    if (!interaction) {
      return true;
    }

    if (!interaction.inGuild() || !interaction.guildId) {
      // DM context - deny access
      const message = '❌ This command can only be used in servers.';
      await this.sendDenialMessage(interaction, message);
      throw new ForbiddenException('Command requires guild context');
    }

    // Check guild ID
    if (interaction.guildId !== this.allowedGuildId) {
      const message = `❌ This command can only be used in the specified guild.`;
      await this.sendDenialMessage(interaction, message);
      throw new ForbiddenException(
        `Command restricted to guild ${this.allowedGuildId}`,
      );
    }

    // Check channel ID
    if (interaction.channelId !== this.allowedChannelId) {
      const message = `❌ This command can only be used in the specified channel.`;
      await this.sendDenialMessage(interaction, message);
      throw new ForbiddenException(
        `Command restricted to channel ${this.allowedChannelId}`,
      );
    }

    return true;
  }

  /**
   * Extract ChatInputCommandInteraction from ExecutionContext
   * Similar to PermissionGuard.getInteraction()
   */
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

  /**
   * Send denial message to Discord interaction
   * Single Responsibility: Send error message to user
   */
  private async sendDenialMessage(
    interaction: ChatInputCommandInteraction,
    reason: string,
  ): Promise<void> {
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: reason,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: reason,
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send denial message to user ${interaction.user.id}:`,
        errorMessage,
      );
    }
  }
}
