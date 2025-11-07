import { injectable } from 'inversify';
import { ChatInputCommandInteraction, PermissionFlagsBits, PermissionResolvable, GuildMember } from 'discord.js';
import { CommandMetadata } from '../commands/interfaces/command-metadata.interface';
import { logger } from '../utils/logger';

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
@injectable()
export class PermissionValidatorService {
  /**
   * Validate if user has permission to execute command
   * Single Responsibility: Permission validation only
   */
  validateCommandPermissions(
    interaction: ChatInputCommandInteraction,
    metadata?: CommandMetadata
  ): ValidationResult {
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

    // Check Discord permissions if specified
    if (metadata.requiredPermissions) {
      const hasPermission = this.checkDiscordPermissions(
        member,
        metadata.requiredPermissions
      );

      if (!hasPermission) {
        return {
          allowed: false,
          reason: 'You do not have permission to use this command',
        };
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
    permissions: PermissionResolvable
  ): boolean {
    try {
      // If member is guild owner or administrator, allow all commands
      if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
      }

      // Check specific permissions
      return member.permissions.has(permissions);
    } catch (error) {
      logger.error('Error checking Discord permissions:', error);
      return false;
    }
  }
}











