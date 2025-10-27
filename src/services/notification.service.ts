import { injectable } from 'inversify';
import { Guild } from 'discord.js';
import { logger } from '../utils/logger';

/**
 * NotificationService - Single Responsibility: User direct messaging
 * 
 * Handles DM sending and error cases (DM failures).
 * Separate from channel messaging (different concerns).
 */
@injectable()
export class NotificationService {
  /**
   * Send a direct message to a user
   */
  async sendDMToUser(userId: string, guild: Guild, message: string): Promise<void> {
    try {
      const member = await guild.members.fetch(userId);
      await member.send(message);
      logger.success(`Sent DM to user ${userId} in ${guild.name}`);
    } catch (error) {
      logger.error(`Failed to send DM to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Notify the guild owner
   */
  async notifyGuildOwner(guild: Guild, message: string): Promise<void> {
    try {
      const owner = await guild.fetchOwner();
      await owner.send(message);
      logger.success(`Notified guild owner in ${guild.name}`);
    } catch (error) {
      logger.error(`Could not DM guild owner in ${guild.name}:`, error);
      // Don't throw - DM failures shouldn't break the bot
    }
  }
}

