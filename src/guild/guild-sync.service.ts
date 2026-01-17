import { Injectable } from '@nestjs/common';
import { Client, Guild } from 'discord.js';
import { ApiService } from '../api/api.service';
import { CreateGuildDto } from '../api/dto/create-guild.dto';
import { AppLogger } from '../common/app-logger.service';

interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  errors: Array<{ guildId: string; error: unknown }>;
}

/**
 * GuildSyncService - Single Responsibility: Synchronizing Discord guilds with database
 *
 * Handles syncing all Discord guilds with the database on bot startup.
 * Processes each guild independently to avoid one failure blocking others.
 */
@Injectable()
export class GuildSyncService {
  constructor(
    private readonly logger: AppLogger,
    private readonly apiService: ApiService,
  ) {
    this.logger.setContext(GuildSyncService.name);
  }

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

    this.logger.log(`Starting sync for ${guildArray.length} guilds`);

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
        (error: unknown) => {
          result.failed++;
          result.errors.push({ guildId: guild.id, error });

          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to sync guild ${guild.name} (${guild.id}):`,
            errorMessage,
          );
        },
      ),
    );

    await Promise.allSettled(syncPromises);

    this.logger.log(
      `Guild sync complete: ${result.synced} synced, ${result.failed} failed out of ${result.total} total`,
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
      this.logger.log(`Syncing guild: ${guild.name} (${guild.id})`);

      // Fetch all members and roles from Discord once
      // Discord.js handles pagination and rate limits internally
      const members = await guild.members.fetch();
      await guild.roles.fetch();

      // Transform to API format, filtering out bots and @everyone role
      const memberData = Array.from(members.values())
        .filter((member) => !member.user.bot)
        .map((member) => ({
          userId: member.user.id,
          username: member.user.username,
          nickname: member.nickname || undefined,
          roles: Array.from(member.roles.cache.keys()).filter(
            (roleId) => roleId !== guild.id,
          ), // Exclude @everyone role (guild ID)
        }));

      const guildData: CreateGuildDto = {
        id: guild.id,
        name: guild.name,
        icon: guild.icon || undefined,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
      };

      // Fetch all roles and detect admin roles (roles with ADMINISTRATOR permission)
      const discordRoles = Array.from(guild.roles.cache.values());
      const adminRoles = discordRoles
        .filter((role) => role.permissions.has('Administrator'))
        .map((role) => ({ id: role.id, name: role.name }));

      const rolesData =
        adminRoles.length > 0 ? { admin: adminRoles } : undefined;

      await this.apiService.syncGuildWithMembersAndRoles(
        guild.id,
        guildData,
        memberData,
        rolesData,
      );

      this.logger.log(
        `Successfully synced guild ${guild.name} with ${memberData.length} members${adminRoles.length > 0 ? ` and ${adminRoles.length} admin role(s)` : ''}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error syncing guild ${guild.name} (${guild.id}):`,
        errorMessage,
      );
      throw error;
    }
  }
}
