import { Injectable, UseGuards } from '@nestjs/common';
import { SlashCommand, Context } from 'necord';
import type { SlashCommandContext } from 'necord';
import { EmbedBuilder } from 'discord.js';
import { ChannelRestrictionGuard } from '../permissions/channel-restriction/channel-restriction.guard';

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
    {
      name: 'config',
      description: 'Get the dashboard link to configure the bot',
    },
    { name: 'help', description: 'Show all available bot commands' },
    {
      name: 'register',
      description: 'Register up to 4 Rocket League tracker URLs',
    },
    {
      name: 'add-tracker',
      description: 'Add an additional tracker URL (up to 4 total)',
    },
    {
      name: 'process-trackers',
      description:
        'Trigger tracker data processing for this server (super user only)',
    },
  ];

  @SlashCommand({
    name: 'help',
    description: 'Show all available bot commands',
  })
  public async onHelp(
    @Context() [interaction]: SlashCommandContext,
  ): Promise<void> {
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

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
