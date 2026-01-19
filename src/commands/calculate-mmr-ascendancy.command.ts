import { Injectable, UseGuards } from '@nestjs/common';
import { SlashCommand, Context, Options } from 'necord';
import type { SlashCommandContext } from 'necord';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import { ChannelRestrictionGuard } from '../permissions/channel-restriction/channel-restriction.guard';
import { AppLogger } from '../common/app-logger.service';
import { ApiService } from '../api/api.service';
import { CalculateMmrAscendancyDto } from './dto/calculate-mmr-ascendancy.dto';
import { CalculateMmrDto as ApiCalculateMmrDto } from '../api/dto/calculate-mmr.dto';
import { AscendancyDataDto } from '../api/dto/ascendancy-data.dto';
import { validate } from 'class-validator';

/**
 * CalculateMmrAscendancyCommand - Single Responsibility: Handle /calculate-mmr-ascendancy command
 *
 * Calculates MMR using the ASCENDANCY algorithm with user-provided data.
 */
@Injectable()
@UseGuards(ChannelRestrictionGuard.create('public'))
export class CalculateMmrAscendancyCommand {
  constructor(
    private readonly logger: AppLogger,
    private readonly apiService: ApiService,
  ) {
    this.logger.setContext(CalculateMmrAscendancyCommand.name);
  }

  @SlashCommand({
    name: 'calculate-mmr-ascendancy',
    description: 'Calculate MMR using ASCENDANCY algorithm',
  })
  public async onCalculateMmrAscendancy(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: CalculateMmrAscendancyDto,
  ): Promise<void> {
    if (!interaction.inGuild() || !interaction.guildId) {
      await interaction.reply({
        content: '❌ This command can only be used in servers.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    this.logger.log('Calculate MMR ASCENDANCY command executed', {
      userId,
      guildId,
    });

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      // Create AscendancyDataDto instance
      const ascendancyData = new AscendancyDataDto();
      ascendancyData.rank2sCurrent = dto['2sCurrentRank'];
      ascendancyData.rank2sPeak = dto['2sPeakRank'];
      ascendancyData.games2sCurrent = dto['2sCurrentGames'];
      ascendancyData.games2sPrevious = dto['2sPreviousGames'];
      ascendancyData.rank3sCurrent = dto['3sCurrentRank'];
      ascendancyData.rank3sPeak = dto['3sPeakRank'];
      ascendancyData.games3sCurrent = dto['3sCurrentGames'];
      ascendancyData.games3sPrevious = dto['3sPreviousGames'];

      // Validate with class-validator
      const errors = await validate(ascendancyData);
      if (errors.length > 0) {
        const errorMessages = errors
          .map((e) => Object.values(e.constraints || {}).join(', '))
          .join('; ');
        await interaction.editReply({
          content: `❌ Validation error: ${errorMessages}`,
        });
        return;
      }

      // Call API
      const calculateData: ApiCalculateMmrDto = {
        guildId,
        ascendancyData,
      };

      const result = await this.apiService.calculateMmr(calculateData);

      // Create embed with result
      const embed = new EmbedBuilder()
        .setTitle('MMR Calculation Result')
        .setDescription(`**Result:** ${result.result}`)
        .addFields({
          name: 'Algorithm',
          value: result.algorithm,
          inline: true,
        })
        .setColor(0x00ff00);

      await interaction.editReply({ embeds: [embed] });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error('Failed to calculate MMR:', error);
      await interaction.editReply({
        content: `❌ Failed to calculate MMR: ${errorMessage}`,
      });
    }
  }
}
