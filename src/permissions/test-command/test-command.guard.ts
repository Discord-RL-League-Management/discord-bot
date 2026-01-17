import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  GuildMember,
  MessageFlags,
} from 'discord.js';
import { ApiService } from '../../api/api.service';
import { AppLogger } from '../../common/app-logger.service';

/**
 * TestCommandGuard - Guard that combines channel check + staff permission check
 * Checks channel first, then staff permission
 * Throws ForbiddenException if either fails
 *
 * Usage: @UseGuards(TestCommandGuard)
 */
@Injectable()
export class TestCommandGuard implements CanActivate {
  constructor(
    private readonly logger: AppLogger,
    private readonly apiService: ApiService,
  ) {
    this.logger.setContext(TestCommandGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const interaction = this.getInteraction(context);
    if (!interaction) {
      return true;
    }

    if (!interaction.inGuild() || !interaction.guildId) {
      // DM context - deny access (test commands require guild)
      const message = '❌ This command can only be used in servers.';
      await this.sendDenialMessage(interaction, message);
      throw new ForbiddenException('Command requires guild context');
    }

    try {
      const channelAllowed = await this.checkChannel(interaction);
      if (!channelAllowed) {
        const message = '❌ This command can only be used in test channels.';
        await this.sendDenialMessage(interaction, message);
        throw new ForbiddenException('Command restricted to test channels');
      }

      if (!interaction.member) {
        const message = '❌ Unable to verify permissions.';
        await this.sendDenialMessage(interaction, message);
        throw new ForbiddenException('Unable to verify member permissions');
      }

      const member = interaction.member as GuildMember;
      const hasStaffRole = await this.checkStaffRoles(
        member,
        interaction.guildId,
      );

      if (!hasStaffRole) {
        const message =
          '❌ You do not have permission to use this command. This command is restricted to staff members.';
        await this.sendDenialMessage(interaction, message);
        throw new ForbiddenException('User does not have staff role');
      }

      return true;
    } catch (error: unknown) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error in test command guard:', errorMessage);
      await this.sendDenialMessage(
        interaction,
        'An error occurred while checking permissions. Please try again later.',
      );
      throw new ForbiddenException(
        `Test command permission check failed: ${errorMessage}`,
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
   * Check if command is in allowed test channels
   */
  private async checkChannel(
    interaction: ChatInputCommandInteraction,
  ): Promise<boolean> {
    try {
      if (!interaction.guildId) {
        return false;
      }

      const settings: unknown = await this.apiService.getGuildSettings(
        interaction.guildId,
      );

      let allowedChannels: string[] | undefined;
      if (
        settings &&
        typeof settings === 'object' &&
        'test_command_channels' in settings
      ) {
        const channelsValue = (settings as Record<string, unknown>)
          .test_command_channels;
        if (Array.isArray(channelsValue)) {
          allowedChannels = channelsValue as string[];
        }
      }

      // Graceful fallback: Empty/missing arrays = allow all channels
      if (!allowedChannels || allowedChannels.length === 0) {
        return true;
      }

      const currentChannelId = interaction.channelId;
      return allowedChannels.includes(currentChannelId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error checking test channels:', errorMessage);
      throw error;
    }
  }

  /**
   * Check if member has staff role from API settings
   * Reuses pattern from PermissionValidatorService.checkStaffRoles()
   */
  private async checkStaffRoles(
    member: GuildMember,
    guildId: string,
  ): Promise<boolean> {
    try {
      const settings: unknown = await this.apiService.getGuildSettings(guildId);
      let staffRoles: string[] | undefined;
      if (
        settings &&
        typeof settings === 'object' &&
        'staffRoles' in settings
      ) {
        const rolesValue = (settings as { staffRoles?: unknown }).staffRoles;
        if (Array.isArray(rolesValue)) {
          staffRoles = rolesValue as string[];
        }
      }

      if (!staffRoles || staffRoles.length === 0) {
        // No staff roles configured, deny access
        return false;
      }

      const memberRoles = Array.from(member.roles.cache.keys());
      return staffRoles.some((staffRoleId) =>
        memberRoles.includes(staffRoleId),
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error fetching staff roles for guild ${guildId}:`,
        errorMessage,
      );
      throw error;
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
