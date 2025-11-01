import { PermissionResolvable } from 'discord.js';

/**
 * CommandMetadata - Single Responsibility: Define permission requirements for commands
 * 
 * Declarative interface for command permission requirements.
 * Separates permission concerns from command execution logic.
 */
export interface CommandMetadata {
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
   * Command category for organization and filtering
   */
  category?: 'admin' | 'user' | 'public';
}

