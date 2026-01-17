import { Injectable, UseGuards } from '@nestjs/common';
import { SlashCommand, Context } from 'necord';
import type { SlashCommandContext } from 'necord';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import { ChannelRestrictionGuard } from '../permissions/channel-restriction/channel-restriction.guard';
import { AppLogger } from '../common/app-logger.service';

/**
 * HelpCommand - Single Responsibility: Handle /help command
 *
 * Lists all available bot commands.
 * Note: Command list is maintained manually since Necord auto-registers commands.
 */
@Injectable()
@UseGuards(ChannelRestrictionGuard.create('public'))
export class HelpCommand {
  // Static list of commands - maintain this when adding new commands
  private readonly commands = [
    { name: 'help', description: 'Show all available bot commands' },
  ];

  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(HelpCommand.name);
  }

  @SlashCommand({
    name: 'help',
    description: 'Show all available bot commands',
  })
  public async onHelp(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
    const guildId = interaction.guildId || 'DM';
    const channelId = interaction.channelId || 'unknown';
    const userId = interaction.user.id;

    this.logger.log('Help command executed', {
      userId,
      guildId,
      channelId,
      commandName: 'help',
    });

    const embed = new EmbedBuilder()
      .setTitle('📖 Bot Commands')
      .setDescription('Here are all available commands:')
      .setColor(0x00ff00);

    this.commands.forEach((command) => {
      embed.addFields({
        name: `/${command.name}`,
        value: command.description,
        inline: false,
      });
    });

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  }
}
