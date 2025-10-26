import { Events, Guild } from 'discord.js';
import { APIClient } from '../client';

/**
 * Handle guild deletion event when bot leaves a server
 * Single Responsibility: Guild leave event handling
 */
export const guildDeleteEvent = {
  name: Events.GuildDelete,
  async execute(guild: Guild) {
    console.log(`Bot left guild: ${guild.name} (${guild.id})`);

    try {
      const apiClient = new APIClient();
      
      // Soft delete - mark as inactive
      await apiClient.removeGuild(guild.id);
      
      console.log(`✅ Successfully removed guild: ${guild.name}`);
    } catch (error) {
      console.error(`❌ Error handling guild leave ${guild.id}:`, error);
    }
  },
};


