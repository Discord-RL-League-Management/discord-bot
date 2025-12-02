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
 * Allows users to register up to 4 Rocket League tracker URLs.
 * The tracker data will be automatically collected via scraping.
 */
@injectable()
export class RegisterCommand implements ICommand {
  data = new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register up to 4 Rocket League tracker URLs')
    .addStringOption((option) =>
      option
        .setName('tracker_url_1')
        .setDescription('Your first tracker URL (required)')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('tracker_url_2')
        .setDescription('Your second tracker URL (optional)')
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('tracker_url_3')
        .setDescription('Your third tracker URL (optional)')
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('tracker_url_4')
        .setDescription('Your fourth tracker URL (optional)')
        .setRequired(false),
    ) as SlashCommandBuilder;

  metadata = {
    category: 'public' as const,
    requiresGuild: false,
  };

  constructor(@inject(TYPES.ApiService) private readonly apiService: ApiService) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Collect all provided URLs (filter out empty ones)
    const urls = [
      interaction.options.getString('tracker_url_1', true),
      interaction.options.getString('tracker_url_2'),
      interaction.options.getString('tracker_url_3'),
      interaction.options.getString('tracker_url_4'),
    ].filter((url): url is string => url !== null && url.trim() !== '');

    const userId = interaction.user.id;
    const userData = {
      username: interaction.user.username,
      globalName: interaction.user.globalName || undefined,
      avatar: interaction.user.avatar || undefined,
    };

    await interaction.deferReply({ ephemeral: true });

    try {
      // Capture channel context for ephemeral follow-up messages
      const channelId = interaction.channelId;
      const interactionToken = interaction.token;

      // Call internal API to register trackers with channel context
      const trackers = await this.apiService.registerTrackers(
        userId,
        urls,
        userData,
        channelId,
        interactionToken,
      );

      const embed = new EmbedBuilder()
        .setTitle('✅ Trackers Registered Successfully')
        .setDescription(`Successfully registered ${trackers.length} tracker(s). Data is being collected in the background.`)
        .setColor(0x00ff00)
        .addFields(
          trackers.map((tracker: any, index: number) => ({
            name: `Tracker ${index + 1}`,
            value: [
              `**URL:** ${tracker.url || 'N/A'}`,
              `**Platform:** ${tracker.platform || 'Unknown'}`,
              `**Username:** ${tracker.username || 'Unknown'}`,
              `**Status:** ${tracker.scrapingStatus || 'PENDING'}`,
            ].join('\n'),
            inline: false,
          })),
        )
        .setFooter({ text: 'You can check your tracker status in the web dashboard.' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      logger.error('Failed to register trackers:', error);

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
          value: 'Make sure your URLs are in the format: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview',
          inline: false,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  }
}

