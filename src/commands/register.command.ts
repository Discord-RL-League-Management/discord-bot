import { Injectable, Logger } from '@nestjs/common';
import { SlashCommand, Context } from 'necord';
import type { SlashCommandContext } from 'necord';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { ApiService } from '../api/api.service';
import { AxiosError } from 'axios';

/**
 * RegisterCommand - Single Responsibility: Handle /register command
 *
 * Allows users to register up to 4 Rocket League tracker URLs.
 * The tracker data will be automatically collected via scraping.
 */

interface TrackerResponse {
  url?: string;
  platform?: string;
  username?: string;
  scrapingStatus?: string;
}

@Injectable()
export class RegisterCommand {
  private readonly logger = new Logger(RegisterCommand.name);

  constructor(private readonly apiService: ApiService) {}

  @SlashCommand(
    new SlashCommandBuilder()
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
      )
      .toJSON(),
  )
  public async onRegister(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
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

      const trackers = (await this.apiService.registerTrackers(
        userId,
        urls,
        userData,
        channelId,
        interactionToken,
      )) as TrackerResponse[];

      const embed = new EmbedBuilder()
        .setTitle('✅ Trackers Registered Successfully')
        .setDescription(
          `Successfully registered ${trackers.length} tracker(s). Data is being collected in the background.`,
        )
        .setColor(0x00ff00)
        .addFields(
          trackers.map((tracker: TrackerResponse, index: number) => ({
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
        .setFooter({
          text: 'You can check your tracker status in the web dashboard.',
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error: unknown) {
      this.logger.error('Failed to register trackers:', error);

      let errorMessage =
        'An error occurred during registration. Please try again.';
      if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as { message?: string };
        if (data.message) {
          errorMessage = data.message;
        }
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      const embed = new EmbedBuilder()
        .setTitle('❌ Registration Failed')
        .setDescription(errorMessage)
        .setColor(0xff0000)
        .addFields({
          name: 'Tip',
          value:
            'Make sure your URLs are in the format: https://rocketleague.tracker.network/rocket-league/profile/{platform}/{username}/overview',
          inline: false,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  }
}
