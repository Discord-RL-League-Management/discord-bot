import { Events, Guild } from 'discord.js';
import { GuildService } from '../services/guild.service';

/**
 * Handle guild deletion event when bot leaves a server
 * Single Responsibility: Orchestration only
 * Delegates all business logic to GuildService
 */
export function createGuildDeleteEvent(guildService: GuildService) {
  return {
    name: Events.GuildDelete,
    execute: async (guild: Guild) => {
      await guildService.handleGuildLeave(guild);
    },
  };
}




















