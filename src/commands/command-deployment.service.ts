import { injectable, inject } from 'inversify';
import { REST, Routes } from 'discord.js';
import { CommandRegistryService } from './command-registry.service';
import { ConfigService } from '../services/config.service';
import { TYPES } from '../config/types';
import { logger } from '../utils/logger';

/**
 * CommandDeploymentService - Single Responsibility: Deploy commands to Discord
 * 
 * Handles registration of slash commands with Discord API.
 * Separates deployment logic from command definitions.
 */
@injectable()
export class CommandDeploymentService {
  constructor(
    @inject(TYPES.CommandRegistryService) private readonly commandRegistry: CommandRegistryService,
    @inject(TYPES.ConfigService) private readonly configService: ConfigService
  ) {}

  async deployCommands(clientId: string): Promise<void> {
    const commands = this.commandRegistry.getAllData();
    const rest = new REST().setToken(this.configService.discordToken);

    try {
      logger.info(`Started refreshing ${commands.length} application (/) commands.`);

      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );

      logger.success(`Successfully reloaded ${commands.length} application (/) commands.`);
    } catch (error) {
      logger.error('Failed to deploy commands:', error);
      throw error;
    }
  }
}












