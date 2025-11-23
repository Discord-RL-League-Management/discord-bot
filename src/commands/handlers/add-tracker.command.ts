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
 * AddTrackerCommand - Single Responsibility: Handle /add-tracker command
 * 
 * Allows registered users to add an additional tracker URL (up to 4 total).
 */
@injectable()
export class AddTrackerCommand implements ICommand {
  data = new SlashCommandBuilder()
    .setName('add-tracker')
    .setDescription('Add an additional tracker URL (up to 4 total)')
    .addStringOption((option) =>
      option
        .setName('tracker_url')
        .setDescription('Your tracker URL (e.g., https://rocketleague.tracker.network/rocket-league/profile/steam/username/overview)')
        .setRequired(true),
    ) as SlashCommandBuilder;

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
      // Call internal API to add tracker
      const tracker = await this.apiService.addTracker(userId, url);

      const embed = new EmbedBuilder()
        .setTitle('✅ Tracker Added Successfully')
        .setDescription('Your tracker has been added. Data is being collected in the background.')
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
      logger.error('Failed to add tracker:', error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'An error occurred while adding the tracker. Please try again.';

      const embed = new EmbedBuilder()
        .setTitle('❌ Add Tracker Failed')
        .setDescription(errorMessage)
        .setColor(0xff0000)
        .addFields({
          name: 'Tip',
          value: 'You can have up to 4 trackers total. Use /register if you haven\'t registered any trackers yet.',
          inline: false,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  }
}

