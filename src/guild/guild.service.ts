import { Injectable, Logger } from '@nestjs/common';
import { Guild } from 'discord.js';
import { ApiService } from '../api/api.service';
import { CreateGuildDto } from '../api/dto/create-guild.dto';

/**
 * GuildService - Single Responsibility: Guild business logic orchestration
 *
 * Orchestrates the flow: API calls → handle errors
 * No direct Discord API calls (delegates to ApiService).
 */
@Injectable()
export class GuildService {
  private readonly logger = new Logger(GuildService.name);

  constructor(private readonly apiService: ApiService) {}

  /**
   * Handle guild join event
   * Single Responsibility: Orchestration and error handling logic
   */
  async handleGuildJoin(guild: Guild): Promise<void> {
    this.logger.log(`Bot joined guild: ${guild.name} (${guild.id})`);

    try {
      const guildData: CreateGuildDto = {
        id: guild.id,
        name: guild.name,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
        icon: guild.icon || undefined,
      };

      await this.apiService.upsertGuild(guildData);

      this.logger.log(`Successfully initialized guild: ${guild.name}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error initializing guild ${guild.id}:`, errorMessage);
      throw error;
    }
  }

  /**
   * Handle guild delete event
   */
  async handleGuildLeave(guild: Guild): Promise<void> {
    this.logger.log(`Bot left guild: ${guild.name} (${guild.id})`);

    try {
      await this.apiService.removeGuild(guild.id);

      this.logger.log(`Successfully removed guild: ${guild.name}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error handling guild leave ${guild.id}:`,
        errorMessage,
      );
      // Don't re-throw - guild leave failures shouldn't crash the bot
    }
  }
}
