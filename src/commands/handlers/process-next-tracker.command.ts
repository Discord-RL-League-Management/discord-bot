import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { injectable, inject } from 'inversify';
import { ICommand } from '../command.interface';
import { ApiService } from '../../services/api.service';
import { ConfigService } from '../../services/config.service';
import { TYPES } from '../../config/types';
import { logger } from '../../utils/logger';

/**
 * ProcessNextTrackerCommand - Single Responsibility: Handle /process_next_tracker command
 * 
 * Allows admins to view the next pending tracker registration for processing.
 */
@injectable()
export class ProcessNextTrackerCommand implements ICommand {
  data = new SlashCommandBuilder()
    .setName('process_next_tracker')
    .setDescription('Get the next pending tracker registration for processing')
    .addStringOption((option) =>
      option
        .setName('username')
        .setDescription('Optional: Get registration for a specific username')
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

  metadata = {
    category: 'admin' as const,
    requiresGuild: true,
    requiredPermissions: PermissionFlagsBits.Administrator,
  };

  constructor(
    @inject(TYPES.ApiService) private readonly apiService: ApiService,
    @inject(TYPES.ConfigService) private readonly configService: ConfigService,
  ) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    const guildId = interaction.guildId;
    const username = interaction.options.getString('username', false);

    await interaction.deferReply({ ephemeral: true });

    try {
      let registration;

      if (username) {
        // Get registration by username (bot authentication)
        const response = await this.apiService.client.get(
          `/internal/trackers/queue/${guildId}/user/${encodeURIComponent(username)}`,
        );
        registration = response.data;
      } else {
        // Get next pending registration (bot authentication)
        const response = await this.apiService.client.get(
          `/internal/trackers/queue/${guildId}/next`,
        );
        registration = response.data;
      }

      if (!registration) {
        const embed = new EmbedBuilder()
          .setTitle('ℹ️ No Pending Registrations')
          .setDescription('There are no pending tracker registrations at this time.')
          .setColor(0x0099ff)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Create embed with registration details
      const embed = new EmbedBuilder()
        .setTitle('📋 Tracker Registration Pending')
        .setColor(0xffa500)
        .addFields(
          {
            name: 'User',
            value: registration.user?.username || registration.userId || 'Unknown',
            inline: true,
          },
          {
            name: 'Status',
            value: registration.status || 'PENDING',
            inline: true,
          },
          {
            name: 'Tracker URL',
            value: registration.url || 'N/A',
            inline: false,
          },
          {
            name: 'Submitted',
            value: new Date(registration.createdAt).toLocaleString(),
            inline: true,
          },
        )
        .setTimestamp();

      // Add processing form link if available
      const dashboardUrl = this.configService.dashboardUrl;
      if (dashboardUrl && registration.id) {
        const processUrl = `${dashboardUrl}/admin/trackers/process/${registration.id}`;
        embed.addFields({
          name: 'Process Registration',
          value: `[Click here to process](${processUrl})`,
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error: any) {
      logger.error('Failed to get next tracker registration:', error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to retrieve tracker registration.';

      const embed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription(errorMessage)
        .setColor(0xff0000)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  }
}

