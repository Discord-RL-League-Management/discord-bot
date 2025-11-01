import { injectable, inject } from 'inversify';
import { Guild } from 'discord.js';
import { DiscordMessageService } from './discord-message.service';
import { ChannelFinderService } from './channel-finder.service';
import { ConfigService } from './config.service';
import { TYPES } from '../config/types';
import { logger } from '../utils/logger';

/**
 * DiscordChannelService - Single Responsibility: Discord channel operations
 * 
 * Handles message sending to channels.
 * Pure Discord.js operations, no business logic.
 * Delegates channel finding to ChannelFinderService.
 */
@injectable()
export class DiscordChannelService {
  constructor(
    @inject(TYPES.DiscordMessageService) private readonly messageService: DiscordMessageService,
    @inject(TYPES.ChannelFinderService) private readonly channelFinder: ChannelFinderService,
    @inject(TYPES.ConfigService) private readonly configService: ConfigService
  ) {}

  /**
   * Try to send a welcome message to a suitable channel
   * Single Responsibility: Channel message sending
   * 
   * Returns boolean indicating success/failure instead of throwing.
   * Non-blocking: logs errors but doesn't throw.
   */
  async trySendWelcomeMessage(guild: Guild): Promise<boolean> {
    try {
      const channel = this.channelFinder.findWelcomeChannel(guild);

      if (!channel) {
        logger.warn(`No suitable channel found for welcome message in ${guild.name}`);
        return false;
      }

      if (!channel.send) {
        logger.warn(`Channel ${channel.name} in ${guild.name} does not support sending messages`);
        return false;
      }

      const embed = this.messageService.createWelcomeEmbed(this.configService.dashboardUrl);
      await channel.send({ embeds: [embed] });
      logger.success(`Sent welcome message to ${channel.name} in ${guild.name}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send welcome message to ${guild.name}:`, error);
      // Don't throw - return false to indicate failure
      return false;
    }
  }
}

