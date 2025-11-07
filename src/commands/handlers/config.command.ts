import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { injectable, inject } from 'inversify';
import { ICommand } from '../command.interface';
import { ConfigService } from '../../services/config.service';
import { TYPES } from '../../config/types';

/**
 * ConfigCommand - Single Responsibility: Handle /config command
 * 
 * Declarative permissions: Command declares requirements, doesn't enforce them.
 * Provides dashboard link and configuration instructions.
 */
@injectable()
export class ConfigCommand implements ICommand {
  data = new SlashCommandBuilder()
    .setName('config')
    .setDescription('Get the dashboard link to configure the bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

  metadata = {
    category: 'admin' as const,
    requiresGuild: true,
    requiredPermissions: PermissionFlagsBits.Administrator,
  };

  constructor(
    @inject(TYPES.ConfigService) private readonly configService: ConfigService
  ) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const dashboardUrl = this.configService.dashboardUrl;
    const guildId = interaction.guildId;
    
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Bot Configuration')
      .setColor(0x00ff00);
    
    if (dashboardUrl && guildId) {
      const guildDashboardUrl = `${dashboardUrl}?guild=${guildId}`;
      embed.setDescription(
        `Configure the bot using the web dashboard:\n\n[Open Dashboard](${guildDashboardUrl})`
      );
    } else {
      embed.setDescription(
        'Dashboard is not configured. Please contact the bot administrator.'
      );
    }
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}


