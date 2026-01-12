import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { SlashCommand, Context } from 'necord';
import type { SlashCommandContext } from 'necord';
import { EmbedBuilder } from 'discord.js';
import { ApiService } from '../api/api.service';
import { ConfigService } from '../config/config.service';
import { AxiosError } from 'axios';
import { ChannelRestrictionGuard } from '../permissions/channel-restriction/channel-restriction.guard';

/**
 * ProcessTrackersCommand - Single Responsibility: Handle /process-trackers command
 *
 * Triggers the API to process/scrape tracker information for the current guild.
 * Only callable by the super user.
 */
@Injectable()
@UseGuards(ChannelRestrictionGuard.create('staff'))
export class ProcessTrackersCommand {
  private readonly logger = new Logger(ProcessTrackersCommand.name);

  constructor(
    private readonly apiService: ApiService,
    private readonly configService: ConfigService,
  ) {}

  @SlashCommand({
    name: 'process-trackers',
    description:
      'Trigger tracker data processing for this server (super user only)',
  })
  public async onProcessTrackers(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
    // Permission checks (guild context, super user) are handled by PermissionGuard
    // via metadata (requiresGuild: true, requiresSuperUser: true) before this method executes

    await interaction.deferReply({ ephemeral: true });

    try {
      // Guard ensures guild context, so guildId is guaranteed to be non-null
      if (!interaction.guildId) {
        throw new Error('Guild ID is required for this command');
      }
      const result = await this.apiService.processTrackers(interaction.guildId);

      const embed = new EmbedBuilder()
        .setTitle('✅ Trackers Processing Started')
        .setDescription(
          `Successfully queued processing for **${result.processed}** tracker(s).`,
        )
        .setColor(0x00ff00)
        .setTimestamp();

      if (result.processed === 0) {
        embed.setDescription('No pending or stale trackers found to process.');
        embed.setColor(0xffaa00); // Orange/yellow for info
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error: unknown) {
      this.logger.error('Failed to process trackers:', error);

      let errorMessage =
        'An error occurred while processing trackers. Please try again.';
      if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as { message?: string };
        if (data.message) {
          errorMessage = data.message;
        }
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      const embed = new EmbedBuilder()
        .setTitle('❌ Process Trackers Failed')
        .setDescription(errorMessage)
        .setColor(0xff0000)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  }
}
