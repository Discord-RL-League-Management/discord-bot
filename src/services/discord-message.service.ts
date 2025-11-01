import { injectable } from 'inversify';
import { EmbedBuilder } from 'discord.js';

/**
 * DiscordMessageService - Single Responsibility: Message and embed formatting
 * 
 * Pure utility class for creating Discord embeds and formatting messages.
 * No Discord API calls, pure data transformation.
 */
@injectable()
export class DiscordMessageService {
  /**
   * Create welcome embed when bot joins a guild
   */
  createWelcomeEmbed(dashboardUrl?: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle('🚀 Rocket League Bot Joined!')
      .setDescription("I'm ready to help manage your Rocket League leagues!")
      .setColor(0x00ff00);
    
    if (dashboardUrl) {
      embed.addFields(
        { name: '🌐 Dashboard', value: `[Click here to access the dashboard](${dashboardUrl})` },
        { name: '⚙️ Setup', value: 'Use `/config` to configure bot settings' },
        { name: '📖 Help', value: 'Use `/help` to see available commands' }
      );
    } else {
      embed.addFields(
        { name: '⚙️ Setup', value: 'Use `/config` to configure bot settings' },
        { name: '📖 Help', value: 'Use `/help` to see available commands' }
      );
    }
    
    return embed.setFooter({ text: 'Use /config to get started!' });
  }

  /**
   * Create error embed for notification messages
   */
  createErrorEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(message)
      .setColor(0xff0000);
  }

  /**
   * Create success embed for confirmation messages
   */
  createSuccessEmbed(message: string): EmbedBuilder {
    return new EmbedBuilder()
      .setTitle('✅ Success')
      .setDescription(message)
      .setColor(0x00ff00);
  }
}

