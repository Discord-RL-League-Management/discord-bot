import { injectable, inject } from 'inversify';
import { Client, Guild } from 'discord.js';
import { ApiService } from './api.service';
import { ErrorClassificationService } from './error-classification.service';
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
    @inject(TYPES.ApiService) private readonly apiService: ApiService,
    @inject(TYPES.ErrorClassificationService) private readonly errorClassification: ErrorClassificationService
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
        (error: any) => {
          result.failed++;
          result.errors.push({ guildId: guild.id, error });
          
          // Enhanced error logging with full context
          const errorContext: any = {
            message: error.message,
            statusCode: error.statusCode,
            code: error.code,
            details: error.details,
            guildInfo: {
              id: guild.id,
              name: guild.name,
              ownerId: guild.ownerId,
              memberCount: guild.memberCount,
            },
          };

          // Add helpful message for database schema errors
          if (this.errorClassification.isDatabaseSchemaError(error)) {
            errorContext.schemaError = true;
            errorContext.actionableMessage = this.errorClassification.getDatabaseSchemaErrorMessage(error);
            logger.error(`Database schema error detected for guild ${guild.name} (${guild.id}):`, errorContext);
            logger.error(this.errorClassification.getDatabaseSchemaErrorMessage(error));
          } else {
            logger.error(`Failed to sync guild ${guild.name} (${guild.id}):`, errorContext);
          }
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
   * Sync a single guild with database atomically
   * Single Responsibility: Single guild synchronization
   * 
   * Fetches all members from Discord once and syncs guild with all members
   * in a single atomic API call, eliminating race conditions.
   */
  async syncGuild(guild: Guild): Promise<void> {
    try {
      logger.info(`Syncing guild: ${guild.name} (${guild.id})`);

      // Fetch all members and roles from Discord once
      // Discord.js handles pagination and rate limits internally
      const members = await guild.members.fetch();
      await guild.roles.fetch();

      // Transform to API format, filtering out bots and @everyone role
      const memberData = Array.from(members.values())
        .filter(member => !member.user.bot) // Exclude bots
        .map(member => ({
          userId: member.user.id,
          username: member.user.username,
          globalName: member.user.globalName || undefined,
          avatar: member.user.avatar || undefined,
          nickname: member.nickname || undefined,
          roles: Array.from(member.roles.cache.keys())
            .filter(roleId => roleId !== guild.id), // Exclude @everyone role (guild ID)
        }));

      // Prepare guild data
      const guildData = {
        id: guild.id,
        name: guild.name,
        icon: guild.icon || undefined,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
      };

      // Fetch all roles and detect admin roles (roles with ADMINISTRATOR permission)
      const discordRoles = Array.from(guild.roles.cache.values());
      const adminRoles = discordRoles
        .filter(role => role.permissions.has('Administrator'))
        .map(role => ({ id: role.id, name: role.name }));

      // Prepare roles data for settings
      const rolesData = adminRoles.length > 0 ? { admin: adminRoles } : undefined;

      // Atomically sync guild with all members and roles in single API call
      await this.apiService.syncGuildWithMembersAndRoles(guild.id, guildData, memberData, rolesData);

      logger.success(
        `Successfully synced guild ${guild.name} with ${memberData.length} members${adminRoles.length > 0 ? ` and ${adminRoles.length} admin role(s)` : ''}`
      );
    } catch (error: any) {
      // Enhanced error logging with full context
      const errorContext: any = {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        details: error.details,
        guildInfo: {
          id: guild.id,
          name: guild.name,
          ownerId: guild.ownerId,
          memberCount: guild.memberCount,
        },
      };

      // Add helpful message for database schema errors
      if (this.errorClassification.isDatabaseSchemaError(error)) {
        errorContext.schemaError = true;
        errorContext.actionableMessage = this.errorClassification.getDatabaseSchemaErrorMessage(error);
        logger.error(`Database schema error detected for guild ${guild.name} (${guild.id}):`, errorContext);
        logger.error(this.errorClassification.getDatabaseSchemaErrorMessage(error));
      } else {
        logger.error(`Error syncing guild ${guild.name} (${guild.id}):`, errorContext);
      }
      throw error;
    }
  }
}
