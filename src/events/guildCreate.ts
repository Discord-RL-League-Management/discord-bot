import { Events, Guild } from 'discord.js';
import { GuildService } from '../services/guild.service';

/**
 * Handle guild creation event when bot joins a server
 * Single Responsibility: Orchestration only
 * Delegates all business logic to GuildService
 */
export function createGuildCreateEvent(guildService: GuildService) {
  return {
    name: Events.GuildCreate,
    execute: async (guild: Guild) => {
      await guildService.handleGuildJoin(guild);
    },
  };
}
