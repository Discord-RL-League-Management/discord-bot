import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { injectable, inject } from 'inversify';
import { ICommand } from '../command.interface';
import { CommandRegistryService } from '../command-registry.service';
import { TYPES } from '../../config/types';

/**
 * HelpCommand - Single Responsibility: Handle /help command
 * 
 * Dynamically lists all available commands from registry.
 * Extensible: automatically includes new commands as they're added.
 */
@injectable()
export class HelpCommand implements ICommand {
  data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available bot commands');

  constructor(
    @inject(TYPES.CommandRegistryService) private readonly commandRegistry: CommandRegistryService
  ) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const commands = this.commandRegistry.getAll();
    
    const embed = new EmbedBuilder()
      .setTitle('📖 Bot Commands')
      .setDescription('Here are all available commands:')
      .setColor(0x00ff00);
    
    commands.forEach(command => {
      embed.addFields({
        name: `/${command.data.name}`,
        value: command.data.description,
        inline: false
      });
    });
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}


