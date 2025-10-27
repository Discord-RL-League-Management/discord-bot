import { injectable } from 'inversify';
import { Guild, TextChannel } from 'discord.js';
import { DiscordMessageService } from './discord-message.service';
import { logger } from '../utils/logger';

/**
 * DiscordChannelService - Single Responsibility: Discord channel operations
 * 
 * Handles channel finding logic and message sending.
 * Pure Discord.js operations, no business logic.
 */
@injectable()
export class DiscordChannelService {
  constructor(private readonly messageService: DiscordMessageService) {}

  /**
   * Find the general channel in a guild
   */
  findGeneralChannel(guild: Guild): TextChannel | null {
    const generalChannel = guild.channels.cache.find(
      (channel) => channel.name.includes('general') && channel.type === 0
    ) as TextChannel | undefined;

    return generalChannel || null;
  }

  /**
   * Send a welcome message to the general channel
   */
  async sendWelcomeMessage(guild: Guild): Promise<void> {
    try {
      const channel = this.findGeneralChannel(guild);

      if (channel && channel.send) {
        const embed = this.messageService.createWelcomeEmbed();
        await channel.send({ embeds: [embed] });
        logger.success(`Sent welcome message to ${guild.name}`);
      } else {
        logger.warn(`No general channel found in ${guild.name}`);
      }
    } catch (error) {
      logger.error(`Failed to send welcome message to ${guild.name}:`, error);
      throw error;
    }
  }
}

