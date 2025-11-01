import { ChatInputCommandInteraction } from 'discord.js';
import { ICommand } from '../commands/command.interface';
import { PermissionValidatorService } from '../services/permission-validator.service';
import { PermissionLoggerService } from '../services/permission-logger.service';

/**
 * Permission Middleware - Single Responsibility: Orchestrate permission checks
 * 
 * Factory pattern for extensibility and testability.
 * Composes validator and logger services without tight coupling.
 */

/**
 * Middleware function that validates permissions before command execution
 * Factory pattern: Returns configured middleware function
 */
export function createPermissionMiddleware(
  validator: PermissionValidatorService,
  logger: PermissionLoggerService
) {
  return async (
    interaction: ChatInputCommandInteraction,
    command: ICommand,
    next: () => Promise<void>
  ): Promise<void> => {
    // Validate permissions
    const result = validator.validateCommandPermissions(
      interaction,
      command.metadata
    );

    // Log the validation attempt
    logger.logCommandExecution(interaction, command, result);

    // If not allowed, deny access
    if (!result.allowed) {
      logger.logPermissionDenial(interaction, result.reason || 'Access denied');

      await interaction.reply({
        content: result.reason || 'You do not have permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    // Log successful permission grant
    logger.logPermissionGrant(interaction, command);

    // Continue to command execution
    await next();
  };
}

