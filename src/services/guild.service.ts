import { injectable, inject } from 'inversify';
import { Guild } from 'discord.js';
import { ApiService } from './api.service';
import { DiscordChannelService } from './discord-channel.service';
import { NotificationService } from './notification.service';
import { ErrorClassificationService } from './error-classification.service';
import { TYPES } from '../config/types';
import { logger } from '../utils/logger';

/**
 * GuildService - Single Responsibility: Guild business logic orchestration
 * 
 * Orchestrates the flow: API calls → send welcome message (non-blocking) → handle errors
 * No direct Discord API calls (delegates to other services).
 * No message formatting (delegates to DiscordMessageService).
 */
@injectable()
export class GuildService {
  constructor(
    @inject(TYPES.ApiService) private readonly apiService: ApiService,
    @inject(TYPES.DiscordChannelService) private readonly channelService: DiscordChannelService,
    @inject(TYPES.NotificationService) private readonly notificationService: NotificationService,
    @inject(TYPES.ErrorClassificationService) private readonly errorClassification: ErrorClassificationService
  ) {}

  /**
   * Handle guild join event
   * Single Responsibility: Orchestration and error handling logic
   */
  async handleGuildJoin(guild: Guild): Promise<void> {
    logger.info(`Bot joined guild: ${guild.name} (${guild.id})`);

    try {
      // Upsert guild in database via API (idempotent)
      await this.apiService.upsertGuild({
        id: guild.id,
        name: guild.name,
        icon: guild.icon || undefined,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
      });

      logger.success(`Successfully initialized guild: ${guild.name}`);

      // Send welcome message in fire-and-forget pattern (non-blocking)
      // Guild creation success is independent of welcome message success
      setImmediate(async () => {
        try {
          const welcomeSent = await this.channelService.trySendWelcomeMessage(guild);
          if (!welcomeSent) {
            logger.warn(`Welcome message not sent for guild ${guild.name}, but guild was initialized successfully`);
          }
        } catch (error) {
          // Log but don't throw - welcome message failures shouldn't affect guild creation
          logger.error(`Failed to send welcome message to ${guild.name}:`, error);
        }
      });
    } catch (error: any) {
      // Handle different error types appropriately
      if (this.errorClassification.isConflictError(error)) {
        // Conflict errors (409) are expected for existing guilds (e.g., bot restart)
        // Don't notify owner, just log and continue
        logger.info(`Guild ${guild.id} already exists (conflict), treating as success`);
        
        // Still try to send welcome message for existing guilds
        setImmediate(async () => {
          try {
            await this.channelService.trySendWelcomeMessage(guild);
          } catch (welcomeError) {
            logger.error(`Failed to send welcome message to ${guild.name}:`, welcomeError);
          }
        });
        return; // Exit successfully - conflict is not an error in upsert context
      }

      // For other errors, log and potentially notify owner
      logger.error(`Error initializing guild ${guild.id}:`, error);

      // Only notify owner on permanent errors (not transient or conflict)
      if (this.errorClassification.isPermanentError(error)) {
        await this.notificationService.notifyGuildOwner(
          guild,
          'There was an error setting up the bot. Please contact support.'
        );
      }

      // Re-throw error for transient errors (may be retried) or permanent errors
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

