import { Injectable } from '@nestjs/common';
import { ChatInputCommandInteraction } from 'discord.js';
import { AppLogger } from '../../../common/app-logger.service';

/**
 * CommandLoggerService - Single Responsibility: Log command execution events
 *
 * Separation of Concerns: Logging logic separate from command execution.
 * Centralizes all command execution logging.
 */
@Injectable()
export class CommandLoggerService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(CommandLoggerService.name);
  }

  /**
   * Log command start
   * Single Responsibility: Logging command start events
   */
  logCommandStart(interaction: ChatInputCommandInteraction): void {
    const guildId = interaction.guildId || 'DM';
    const channelId = interaction.channelId || 'unknown';
    const userId = interaction.user.id;
    const commandName = interaction.commandName;

    this.logger.log(`Command started: ${commandName}`, {
      userId,
      guildId,
      channelId,
      commandName,
    });
  }

  /**
   * Log successful command completion
   * Single Responsibility: Logging successful completion events
   */
  logCommandSuccess(
    interaction: ChatInputCommandInteraction,
    duration: number,
  ): void {
    const guildId = interaction.guildId || 'DM';
    const channelId = interaction.channelId || 'unknown';
    const userId = interaction.user.id;
    const commandName = interaction.commandName;

    this.logger.log(`Command completed: ${commandName}`, {
      userId,
      guildId,
      channelId,
      commandName,
      duration: `${duration}ms`,
    });
  }
}
