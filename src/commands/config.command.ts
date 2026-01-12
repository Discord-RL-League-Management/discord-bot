import { Injectable, UseGuards } from '@nestjs/common';
import { SlashCommand, Context } from 'necord';
import type { SlashCommandContext } from 'necord';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { ConfigService } from '../config/config.service';
import { ChannelRestrictionGuard } from '../permissions/channel-restriction/channel-restriction.guard';

/**
 * ConfigCommand - Single Responsibility: Handle /config command
 *
 * Declarative permissions: Command declares requirements, doesn't enforce them.
 * Provides dashboard link and configuration instructions.
 */
@Injectable()
@UseGuards(ChannelRestrictionGuard.create('staff'))
export class ConfigCommand {
  constructor(private readonly configService: ConfigService) {}

  @SlashCommand({
    name: 'config',
    description: 'Get the dashboard link to configure the bot',
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
  })
  public async onConfig(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
    const dashboardUrl = this.configService.getDashboardUrl();
    const guildId = interaction.guildId;

    const embed = new EmbedBuilder()
      .setTitle('⚙️ Bot Configuration')
      .setColor(0x00ff00);

    if (dashboardUrl && guildId) {
      const guildDashboardUrl = `${dashboardUrl}?guild=${guildId}`;
      embed.setDescription(
        `Configure the bot using the web dashboard:\n\n[Open Dashboard](${guildDashboardUrl})`,
      );
    } else {
      embed.setDescription(
        'Dashboard is not configured. Please contact the bot administrator.',
      );
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
