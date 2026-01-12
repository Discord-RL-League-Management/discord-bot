import { Injectable, Logger } from '@nestjs/common';
import { ChatInputCommandInteraction } from 'discord.js';
import { ValidationResult } from '../permission-validator/permission-validator.service';
import { PermissionMetadata } from '../permission-metadata.interface';

/**
 * PermissionLoggerService - Single Responsibility: Log permission-related events
 *
 * Separation of Concerns: Logging logic separate from validation and execution.
 * Centralizes all permission-related logging.
 */
@Injectable()
export class PermissionLoggerService {
  private readonly logger = new Logger(PermissionLoggerService.name);

  /**
   * Log command execution with permissions
   * Single Responsibility: Logging execution events
   */
  logCommandExecution(
    interaction: ChatInputCommandInteraction,
    result: ValidationResult,
    metadata?: PermissionMetadata,
  ): void {
    const guildId = interaction.guildId || 'DM';
    const channelId = interaction.channelId || 'unknown';
    const userId = interaction.user.id;
    const commandName = interaction.commandName;

    this.logger.log(`Command execution: ${commandName}`, {
      userId,
      guildId,
      channelId,
      allowed: result.allowed,
      category: metadata?.category || 'public',
    });
  }

  /**
   * Log permission denial
   * Single Responsibility: Logging denial events
   */
  logPermissionDenial(
    interaction: ChatInputCommandInteraction,
    reason: string,
  ): void {
    const guildId = interaction.guildId || 'DM';
    const userId = interaction.user.id;
    const commandName = interaction.commandName;

    this.logger.warn('Permission denied', {
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
    metadata?: PermissionMetadata,
  ): void {
    const guildId = interaction.guildId || 'DM';
    const userId = interaction.user.id;
    const commandName = interaction.commandName;

    this.logger.log('Permission granted', {
      userId,
      guildId,
      commandName,
      category: metadata?.category || 'public',
    });
  }
}
