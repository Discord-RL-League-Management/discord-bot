import { injectable, inject } from 'inversify';
import { Guild } from 'discord.js';
import { ApiService } from './api.service';
import { DiscordChannelService } from './discord-channel.service';
import { NotificationService } from './notification.service';
import { logger } from '../utils/logger';

/**
 * GuildService - Single Responsibility: Guild business logic orchestration
 * 
 * Orchestrates the flow: API calls → find channel → send message → handle errors
 * No direct Discord API calls (delegates to other services).
 * No message formatting (delegates to DiscordMessageService).
 */
@injectable()
export class GuildService {
  constructor(
    @inject(ApiService) private readonly apiService: ApiService,
    @inject(DiscordChannelService) private readonly channelService: DiscordChannelService,
    @inject(NotificationService) private readonly notificationService: NotificationService
  ) {}

  /**
   * Handle guild join event
   */
  async handleGuildJoin(guild: Guild): Promise<void> {
    logger.info(`Bot joined guild: ${guild.name} (${guild.id})`);

    try {
      // Create guild in database via API
      await this.apiService.createGuild({
        id: guild.id,
        name: guild.name,
        icon: guild.icon || undefined,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
      });

      // Send welcome message
      await this.channelService.sendWelcomeMessage(guild);

      logger.success(`Successfully initialized guild: ${guild.name}`);
    } catch (error) {
      logger.error(`Error initializing guild ${guild.id}:`, error);

      // Try to notify guild owner
      await this.notificationService.notifyGuildOwner(
        guild,
        'There was an error setting up the bot. Please contact support.'
      );

      throw error;
    }
  }

  /**
   * Handle guild delete event
   */
  async handleGuildLeave(guild: Guild): Promise<void> {
    logger.info(`Bot left guild: ${guild.name} (${guild.id})`);

    try {
      // Remove guild from database
      await this.apiService.removeGuild(guild.id);

      logger.success(`Successfully removed guild: ${guild.name}`);
    } catch (error) {
      logger.error(`Error handling guild leave ${guild.id}:`, error);
      // Don't re-throw - guild leave failures shouldn't crash the bot
    }
  }
}

