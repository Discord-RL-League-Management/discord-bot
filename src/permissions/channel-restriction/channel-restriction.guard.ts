import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Type,
} from '@nestjs/common';
import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { ApiService } from '../../api/api.service';
import { AppLogger } from '../../common/app-logger.service';

/**
 * ChannelRestrictionGuard - Guard that validates commands execute in allowed channels
 * Accepts command type: 'staff' | 'public' | 'test'
 * Throws ForbiddenException if command is used in wrong channel
 *
 * Usage: @UseGuards(ChannelRestrictionGuard.create('staff'))
 */
export class ChannelRestrictionGuard {
  /**
   * Factory function to create guard with specific command type
   * Returns a class that can be used with @UseGuards()
   */
  static create(commandType: 'staff' | 'public' | 'test'): Type<CanActivate> {
    @Injectable()
    class ChannelRestrictionGuardImpl implements CanActivate {
      constructor(
        private readonly logger: AppLogger,
        private readonly apiService: ApiService,
      ) {
        this.logger.setContext(ChannelRestrictionGuardImpl.name);
      }

      async canActivate(context: ExecutionContext): Promise<boolean> {
        const interaction = this.getInteraction(context);
        if (!interaction) {
          return true;
        }

        if (!interaction.inGuild() || !interaction.guildId) {
          // DM context - deny access (channel restrictions require guild context)
          const message = '❌ This command can only be used in servers.';
          await this.sendDenialMessage(interaction, message);
          throw new ForbiddenException('Command requires guild context');
        }

        try {
          const settings: unknown = await this.apiService.getGuildSettings(
            interaction.guildId,
          );

          let allowedChannels: string[] | undefined;
          const channelArrayKey = this.getChannelArrayKey(commandType);
          if (
            settings &&
            typeof settings === 'object' &&
            channelArrayKey in settings
          ) {
            const channelsValue = (settings as Record<string, unknown>)[
              channelArrayKey
            ];
            if (Array.isArray(channelsValue)) {
              allowedChannels = channelsValue as string[];
            }
          }

          // Graceful fallback: Empty/missing arrays = allow all channels
          if (!allowedChannels || allowedChannels.length === 0) {
            return true;
          }

          const currentChannelId = interaction.channelId;
          if (!allowedChannels.includes(currentChannelId)) {
            const channelTypeName = this.getChannelTypeName(commandType);
            const message = `❌ This command can only be used in ${channelTypeName} channels.`;
            await this.sendDenialMessage(interaction, message);
            throw new ForbiddenException(
              `Command restricted to ${channelTypeName} channels`,
            );
          }

          return true;
        } catch (error: unknown) {
          if (error instanceof ForbiddenException) {
            throw error;
          }

          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            'Error in channel restriction guard:',
            errorMessage,
          );
          await this.sendDenialMessage(
            interaction,
            'An error occurred while checking channel restrictions. Please try again later.',
          );
          throw new ForbiddenException(
            `Channel restriction check failed: ${errorMessage}`,
          );
        }
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
       * Get the channel array key from settings based on command type
       */
      private getChannelArrayKey(type: 'staff' | 'public' | 'test'): string {
        switch (type) {
          case 'staff':
            return 'staff_command_channels';
          case 'public':
            return 'public_command_channels';
          case 'test':
            return 'test_command_channels';
          default:
            return 'public_command_channels';
        }
      }

      /**
       * Get human-readable channel type name
       */
      private getChannelTypeName(type: 'staff' | 'public' | 'test'): string {
        switch (type) {
          case 'staff':
            return 'staff';
          case 'public':
            return 'public';
          case 'test':
            return 'test';
          default:
            return 'allowed';
        }
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

    return ChannelRestrictionGuardImpl;
  }
}
