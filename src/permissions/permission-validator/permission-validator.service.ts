import { Injectable } from '@nestjs/common';
import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  PermissionResolvable,
  GuildMember,
} from 'discord.js';
import { ApiService } from '../../api/api.service';
import { ConfigService } from '../../config/config.service';
import { PermissionMetadata } from '../permission-metadata.interface';
import { AppLogger } from '../../common/app-logger.service';

/**
 * ValidationResult - Result of permission validation
 */
export interface ValidationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * PermissionValidatorService - Single Responsibility: Validate command permissions
 *
 * Separates permission validation logic from logging and execution.
 * Only validates permissions, doesn't log or execute commands.
 */
@Injectable()
export class PermissionValidatorService {
  constructor(
    private readonly logger: AppLogger,
    private readonly apiService: ApiService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(PermissionValidatorService.name);
  }

  /**
   * Validate if user has permission to execute command
   * Single Responsibility: Permission validation only
   */
  async validateCommandPermissions(
    interaction: ChatInputCommandInteraction,
    metadata?: PermissionMetadata,
  ): Promise<ValidationResult> {
    // If no metadata, allow access (public command)
    if (!metadata) {
      return { allowed: true };
    }

    // Check if command requires guild context
    if (metadata.requiresGuild && !interaction.inGuild()) {
      return {
        allowed: false,
        reason: 'This command can only be used in servers',
      };
    }

    // Check if interaction has member (guild context)
    if (!interaction.member) {
      return { allowed: true }; // DMs don't need permission checks beyond guild requirement
    }

    const member = interaction.member as GuildMember;
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    // Check super user if required
    if (metadata.requiresSuperUser) {
      const superUserId = this.configService.getSuperUserId();
      if (!superUserId || userId !== superUserId) {
        this.logger.warn(
          `Unauthorized super user attempt by user ${userId} on command ${interaction.commandName}`,
        );
        return {
          allowed: false,
          reason: 'You do not have permission to use this command.',
        };
      }
    }

    // Check Discord permissions if specified
    if (metadata.requiredPermissions) {
      const hasPermission = this.checkDiscordPermissions(
        member,
        metadata.requiredPermissions,
      );

      if (!hasPermission) {
        return {
          allowed: false,
          reason: 'You do not have permission to use this command',
        };
      }
    }

    // Check staff roles if required
    if (metadata.requiresStaffRole && guildId) {
      try {
        const hasStaffRole = await this.checkStaffRoles(member, guildId);
        if (!hasStaffRole) {
          return {
            allowed: false,
            reason: 'You do not have permission to use this command',
          };
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Error checking staff roles for user ${userId} in guild ${guildId}:`,
          errorMessage,
        );
        // On error, allow access but log it (fail open for now)
        // In production, you might want to fail closed
        return { allowed: true };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if member has Discord permissions
   * Private: Single Responsibility - internal validation helper
   */
  private checkDiscordPermissions(
    member: GuildMember,
    permissions: PermissionResolvable,
  ): boolean {
    try {
      // If member is guild owner or administrator, allow all commands
      if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
      }

      // Check specific permissions
      return member.permissions.has(permissions);
    } catch (error: unknown) {
      this.logger.error('Error checking Discord permissions:', error);
      return false;
    }
  }

  /**
   * Check if member has staff role from API settings
   * Private: Single Responsibility - check staff roles from API
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

      // Check if member has any of the staff roles
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
}
