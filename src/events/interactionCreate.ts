import { Events, Interaction, ChatInputCommandInteraction } from 'discord.js';
import { CommandRegistryService } from '../commands/command-registry.service';
import { PermissionValidatorService } from '../services/permission-validator.service';
import { PermissionLoggerService } from '../services/permission-logger.service';
import { createPermissionMiddleware } from '../middleware/permission-check.middleware';
import { logger } from '../utils/logger';

/**
 * Interaction Create Event - Single Responsibility: Route interactions to handlers
 * 
 * Composition: Composes permission services without implementing validation logic.
 * Keeps handler focused on routing only, delegates to specialized services.
 */
export function createInteractionCreateEvent(
  commandRegistry: CommandRegistryService,
  permissionValidator: PermissionValidatorService,
  permissionLogger: PermissionLoggerService
) {
  // Create permission middleware using factory pattern
  const permissionMiddleware = createPermissionMiddleware(
    permissionValidator,
    permissionLogger
  );

  return {
    name: Events.InteractionCreate,
    execute: async (interaction: Interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = commandRegistry.get(interaction.commandName);

      if (!command) {
        logger.warn(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        // Apply permission middleware before execution
        await permissionMiddleware(
          interaction as ChatInputCommandInteraction,
          command,
          async () => {
            // Command execution proceeds here if permissions validated
            await command.execute(interaction as ChatInputCommandInteraction);
          }
        );
      } catch (error) {
        logger.error(`Error executing ${interaction.commandName}:`, error);
        
        const errorMessage = { 
          content: 'There was an error executing this command!', 
          ephemeral: true 
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    },
  };
}


