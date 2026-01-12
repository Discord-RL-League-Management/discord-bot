import { PermissionResolvable } from 'discord.js';

/**
 * PermissionMetadata - Single Responsibility: Define permission requirements for commands
 *
 * Declarative interface for command permission requirements.
 * Separates permission concerns from command execution logic.
 */
export interface PermissionMetadata {
  /**
   * Discord permission flags required to execute this command
   * Set via setDefaultMemberPermissions on SlashCommandBuilder
   */
  requiredPermissions?: PermissionResolvable;

  /**
   * Whether this command requires guild context (not available in DMs)
   */
  requiresGuild?: boolean;

  /**
   * Whether this command requires super user permission
   */
  requiresSuperUser?: boolean;

  /**
   * Whether this command requires staff role from API settings
   */
  requiresStaffRole?: boolean;

  /**
   * Command category for organization and filtering
   */
  category?: 'admin' | 'user' | 'public';
}
