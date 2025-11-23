import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { injectable, inject } from 'inversify';
import { ICommand } from '../command.interface';
import { ApiService } from '../../services/api.service';
import { TYPES } from '../../config/types';
import { logger } from '../../utils/logger';

/**
 * RegisterCommand - Single Responsibility: Handle /register command
 * 
 * Allows users to register their Rocket League tracker URL.
 * The tracker data will be automatically collected via scraping.
 */
@injectable()
export class RegisterCommand implements ICommand {
  data = new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your Rocket League tracker URL')
    .addStringOption((option) =>
      option
        .setName('tracker_url')
        .setDescription('Your tracker URL (e.g., https://rocketleague.tracker.network/rocket-league/profile/steam/username/overview)')
        .setRequired(true),
    );

  metadata = {
    category: 'public' as const,
    requiresGuild: false,
  };

  constructor(@inject(TYPES.ApiService) private readonly apiService: ApiService) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const url = interaction.options.getString('tracker_url', true);
    const userId = interaction.user.id;

    await interaction.deferReply({ ephemeral: true });

    try {
      // Call internal API to register tracker (bot authentication)
      const tracker = await this.apiService.registerTracker(userId, url);

      const embed = new EmbedBuilder()
        .setTitle('✅ Tracker Registered Successfully')
        .setDescription('Your tracker has been registered. Data is being collected in the background.')
        .setColor(0x00ff00)
        .addFields(
          {
            name: 'Tracker URL',
            value: tracker.url || url,
            inline: false,
          },
          {
            name: 'Platform',
            value: tracker.platform || 'Unknown',
            inline: true,
          },
          {
            name: 'Username',
            value: tracker.username || 'Unknown',
            inline: true,
          },
          {
            name: 'Status',
            value: tracker.scrapingStatus || 'PENDING',
            inline: true,
          },
        )
        .setFooter({ text: 'You can check your tracker status in the web dashboard.' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      logger.error('Failed to register tracker:', error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'An error occurred during registration. Please try again.';

      const embed = new EmbedBuilder()
        .setTitle('❌ Registration Failed')
        .setDescription(errorMessage)
        .setColor(0xff0000)
        .addFields({
          name: 'Tip',
          value: 'Make sure your URL is in the format: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview',
          inline: false,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  }
}

