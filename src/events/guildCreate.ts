import { Events, Guild } from 'discord.js';
import { APIClient } from '../client';

/**
 * Handle guild creation event when bot joins a server
 * Single Responsibility: Guild join event handling
 */
export const guildCreateEvent = {
  name: Events.GuildCreate,
  async execute(guild: Guild) {
    console.log(`Bot joined guild: ${guild.name} (${guild.id})`);

    try {
      const apiClient = new APIClient();

      // Create guild in database
      await apiClient.createGuild({
        id: guild.id,
        name: guild.name,
        icon: guild.icon || undefined,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
      });

      // Send welcome message
      const generalChannel = guild.channels.cache.find(
        channel => channel.name.includes('general') && channel.type === 0
      ) as any;

      if (generalChannel && generalChannel.send) {
        await generalChannel.send({
          embeds: [{
            title: '🚀 Rocket League Bot Joined!',
            description: 'I\'m ready to help manage your Rocket League leagues!',
            fields: [
              { name: '⚙️ Setup', value: 'Use `/config` to configure bot settings' },
              { name: '📖 Help', value: 'Use `/help` to see available commands' },
              { name: '🌐 Dashboard', value: 'Visit the web dashboard to manage leagues' }
            ],
            color: 0x00ff00,
            footer: { text: 'Use /config to get started!' }
          }]
        });
      }

      console.log(`✅ Successfully initialized guild: ${guild.name}`);
    } catch (error) {
      console.error(`❌ Error initializing guild ${guild.id}:`, error);
      
      // Try to notify guild owner
      try {
        const owner = await guild.fetchOwner();
        await owner.send(
          'There was an error setting up the bot. Please contact support.'
        );
      } catch (dmError) {
        console.error('Could not DM guild owner:', dmError);
      }
    }
  },
};
