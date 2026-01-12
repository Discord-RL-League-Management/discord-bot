import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { ApiService } from '../../api/api.service';

/**
 * StaffOnlyGuard - Guard that validates user has staff role
 * Throws ForbiddenException if user is not staff
 */
@Injectable()
export class StaffOnlyGuard implements CanActivate {
  private readonly logger = new Logger(StaffOnlyGuard.name);

  constructor(private readonly apiService: ApiService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const interaction = this.getInteraction(context);
    if (!interaction) {
      return true;
    }

    if (!interaction.inGuild() || !interaction.guildId) {
      // DM context - deny access (staff commands require guild)
      const message = '❌ This command can only be used in servers.';
      await this.sendDenialMessage(interaction, message);
      throw new ForbiddenException('Command requires guild context');
    }

    if (!interaction.member) {
      const message = '❌ Unable to verify permissions.';
      await this.sendDenialMessage(interaction, message);
      throw new ForbiddenException('Unable to verify member permissions');
    }

    try {
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
      this.logger.error('Error in staff-only guard:', errorMessage);
      await this.sendDenialMessage(
        interaction,
        'An error occurred while checking staff permissions. Please try again later.',
      );
      throw new ForbiddenException(
        `Staff permission check failed: ${errorMessage}`,
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
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: reason,
          ephemeral: true,
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
