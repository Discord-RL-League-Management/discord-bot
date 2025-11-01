import { injectable, inject } from 'inversify';
import { Client, Guild } from 'discord.js';
import { ApiService } from './api.service';
import { TYPES } from '../config/types';
import { logger } from '../utils/logger';
import { SyncResult } from '../types/operation-results';

/**
 * GuildSyncService - Single Responsibility: Synchronizing Discord guilds with database
 * 
 * Handles syncing all Discord guilds with the database on bot startup.
 * Processes each guild independently to avoid one failure blocking others.
 */
@injectable()
export class GuildSyncService {
  constructor(
    @inject(TYPES.ApiService) private readonly apiService: ApiService
  ) {}

  /**
   * Sync all guilds from Discord client with database
   * Single Responsibility: Bulk guild synchronization
   * 
   * Handles errors per-guild (one failure doesn't stop others).
   * Returns summary of sync results.
   */
  async syncAllGuilds(client: Client): Promise<SyncResult> {
    const guilds = client.guilds.cache.values();
    const guildArray = Array.from(guilds);
    
    logger.info(`Starting sync for ${guildArray.length} guilds`);

    const result: SyncResult = {
      total: guildArray.length,
      synced: 0,
      failed: 0,
      errors: [],
    };

    // Process all guilds in parallel, but handle errors independently
    const syncPromises = guildArray.map((guild) =>
      this.syncGuild(guild).then(
        () => {
          result.synced++;
        },
        (error) => {
          result.failed++;
          result.errors.push({ guildId: guild.id, error });
          logger.error(`Failed to sync guild ${guild.name} (${guild.id}):`, error);
        }
      )
    );

    await Promise.allSettled(syncPromises);

    logger.success(
      `Guild sync complete: ${result.synced} synced, ${result.failed} failed out of ${result.total} total`
    );

    return result;
  }

  /**
   * Sync a single guild with database
   * Single Responsibility: Single guild synchronization
   */
  async syncGuild(guild: Guild): Promise<void> {
    try {
      logger.info(`Syncing guild: ${guild.name} (${guild.id})`);

      await this.apiService.upsertGuild({
        id: guild.id,
        name: guild.name,
        icon: guild.icon || undefined,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
      });

      logger.info(`Successfully synced guild: ${guild.name}`);
    } catch (error) {
      logger.error(`Error syncing guild ${guild.id}:`, error);
      throw error;
    }
  }
}
