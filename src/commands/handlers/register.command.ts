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
 * Allows users to register their tracker URL for admin approval.
 */
@injectable()
export class RegisterCommand implements ICommand {
  data = new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your tracker URL for admin approval')
    .addStringOption((option) =>
      option
        .setName('url')
        .setDescription('Your tracker URL (tracker.gg or TRN)')
        .setRequired(true),
    );

  metadata = {
    category: 'public' as const,
    requiresGuild: true,
  };

  constructor(@inject(TYPES.ApiService) private readonly apiService: ApiService) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    const url = interaction.options.getString('url', true);
    const userId = interaction.user.id;
    const guildId = interaction.guildId;

    await interaction.deferReply({ ephemeral: true });

    try {
      // Call internal API to register tracker (bot authentication)
      const response = await this.apiService.client.post(
        '/internal/trackers/register',
        {
          url,
          guildId,
          userId,
        },
      );

      const embed = new EmbedBuilder()
        .setTitle('✅ Registration Successful')
        .setDescription(response.data.message || 'You are registered. Your tracker is pending admin approval.')
        .setColor(0x00ff00)
        .addFields({
          name: 'Status',
          value: response.data.status || 'PENDING',
        })
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
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  }
}

