import { injectable } from 'inversify';
import { ChatInputCommandInteraction } from 'discord.js';
import { ICommand } from '../commands/command.interface';
import { logger } from '../utils/logger';
import { ValidationResult } from './permission-validator.service';

/**
 * PermissionLoggerService - Single Responsibility: Log permission-related events
 * 
 * Separation of Concerns: Logging logic separate from validation and execution.
 * Centralizes all permission-related logging.
 */
@injectable()
export class PermissionLoggerService {
  /**
   * Log command execution with permissions
   * Single Responsibility: Logging execution events
   */
  logCommandExecution(
    interaction: ChatInputCommandInteraction,
    command: ICommand,
    result: ValidationResult
  ): void {
    const guildId = interaction.guildId || 'DM';
    const channelId = interaction.channelId || 'unknown';
    const userId = interaction.user.id;
    const commandName = command.data.name;

    logger.info(`Command execution: ${commandName}`, {
      userId,
      guildId,
      channelId,
      allowed: result.allowed,
      category: command.metadata?.category || 'public',
    });
  }

  /**
   * Log permission denial
   * Single Responsibility: Logging denial events
   */
  logPermissionDenial(
    interaction: ChatInputCommandInteraction,
    reason: string
  ): void {
    const guildId = interaction.guildId || 'DM';
    const userId = interaction.user.id;
    const commandName = interaction.commandName;

    logger.warn('Permission denied', {
      userId,
      guildId,
      commandName,
      reason,
    });
  }

  /**
   * Log successful permission grant
   * Single Responsibility: Logging grant events
   */
  logPermissionGrant(
    interaction: ChatInputCommandInteraction,
    command: ICommand
  ): void {
    const guildId = interaction.guildId || 'DM';
    const userId = interaction.user.id;
    const commandName = command.data.name;

    logger.info('Permission granted', {
      userId,
      guildId,
      commandName,
      category: command.metadata?.category || 'public',
    });
  }
}











