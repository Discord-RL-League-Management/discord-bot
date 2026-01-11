import { Injectable, Logger } from '@nestjs/common';
import { SlashCommand, Context } from 'necord';
import type { SlashCommandContext } from 'necord';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { ApiService } from '../api/api.service';
import { AxiosError } from 'axios';

/**
 * AddTrackerCommand - Single Responsibility: Handle /add-tracker command
 *
 * Allows registered users to add an additional tracker URL (up to 4 total).
 */

interface TrackerResponse {
  url?: string;
  platform?: string;
  username?: string;
  scrapingStatus?: string;
}

@Injectable()
export class AddTrackerCommand {
  private readonly logger = new Logger(AddTrackerCommand.name);

  constructor(private readonly apiService: ApiService) {}

  @SlashCommand(
    new SlashCommandBuilder()
      .setName('add-tracker')
      .setDescription('Add an additional tracker URL (up to 4 total)')
      .addStringOption((option) =>
        option
          .setName('tracker_url')
          .setDescription('Your tracker profile URL')
          .setRequired(true),
      )
      .toJSON(),
  )
  public async onAddTracker(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
    const url = interaction.options.getString('tracker_url', true);
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

      const tracker = (await this.apiService.addTracker(
        userId,
        url,
        userData,
        channelId,
        interactionToken,
      )) as TrackerResponse;

      const embed = new EmbedBuilder()
        .setTitle('✅ Tracker Added Successfully')
        .setDescription(
          'Your tracker has been added. Data is being collected in the background.',
        )
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
        .setFooter({
          text: 'You can check your tracker status in the web dashboard.',
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error: unknown) {
      this.logger.error('Failed to add tracker:', error);

      let errorMessage =
        'An error occurred while adding the tracker. Please try again.';
      if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as { message?: string };
        if (data.message) {
          errorMessage = data.message;
        }
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      const embed = new EmbedBuilder()
        .setTitle('❌ Add Tracker Failed')
        .setDescription(errorMessage)
        .setColor(0xff0000)
        .addFields({
          name: 'Tip',
          value:
            "You can have up to 4 trackers total. Use /register if you haven't registered any trackers yet.",
          inline: false,
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  }
}
