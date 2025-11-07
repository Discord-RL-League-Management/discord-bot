import { Events, Interaction, ChatInputCommandInteraction } from 'discord.js';
import { CommandRegistryService } from '../commands/command-registry.service';
import { PermissionValidatorService } from '../services/permission-validator.service';
import { PermissionLoggerService } from '../services/permission-logger.service';
import { ApiService } from '../services/api.service';
import { CooldownService } from '../services/cooldown.service';
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
  permissionLogger: PermissionLoggerService,
  apiService: ApiService,
  cooldownService: CooldownService
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
        // Check bot command channel restrictions
        if (interaction.guildId) {
          try {
            const settings = await apiService.getGuildSettings(interaction.guildId);
            
            // Check register-specific channel restrictions first
            if (interaction.commandName === 'register') {
              const registerChannels = settings.register_command_channels || [];
              
              // If register_command_channels is set, use it; otherwise fall back to bot_command_channels
              if (registerChannels.length > 0) {
                const channelId = interaction.channelId;
                const isAllowed = registerChannels.some((ch: any) => ch.id === channelId);
                
                if (!isAllowed) {
                  await interaction.reply({
                    content: 'The /register command can only be used in designated registration channels.',
                    ephemeral: true
                  });
                  return;
                }
              } else {
                // Fall back to bot_command_channels if register_command_channels is empty
                const allowedChannels = settings.bot_command_channels || [];
                
                // Empty array = all channels allowed
                if (allowedChannels.length > 0) {
                  const channelId = interaction.channelId;
                  const isAllowed = allowedChannels.some((ch: any) => ch.id === channelId);
                  
                  if (!isAllowed) {
                    await interaction.reply({
                      content: 'This command can only be used in designated bot command channels.',
                      ephemeral: true
                    });
                    return;
                  }
                }
              }
            } else {
              // For other commands, check bot_command_channels
              const allowedChannels = settings.bot_command_channels || [];
              
              // Empty array = all channels allowed
              if (allowedChannels.length > 0) {
                const channelId = interaction.channelId;
                const isAllowed = allowedChannels.some((ch: any) => ch.id === channelId);
                
                if (!isAllowed) {
                  await interaction.reply({
                    content: 'This command can only be used in designated bot command channels.',
                    ephemeral: true
                  });
                  return;
                }
              }
            }
          } catch (error) {
            // If fetching settings fails, log but don't block command execution
            logger.warn(`Failed to fetch settings for guild ${interaction.guildId}:`, error);
          }
        }

        // Check cooldown for commands that require it
        if (interaction.commandName === 'register') {
          const cooldownSeconds = 10; // Default cooldown for register command
          const remaining = cooldownService.checkCooldown(
            interaction.user.id,
            interaction.commandName,
            cooldownSeconds
          );

          if (remaining > 0) {
            await interaction.reply({
              content: `⏱️ Please wait ${remaining} second${remaining > 1 ? 's' : ''} before using this command again.`,
              ephemeral: true,
            });
            return;
          }

          // Set cooldown immediately before command execution
          cooldownService.setCooldown(
            interaction.user.id,
            interaction.commandName,
            cooldownSeconds
          );
        }

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


