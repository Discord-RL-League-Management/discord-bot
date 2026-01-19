import { Injectable, UseGuards } from '@nestjs/common';
import { SlashCommand, Context, Options } from 'necord';
import type { SlashCommandContext } from 'necord';
import { MessageFlags } from 'discord.js';
import { E2ERestrictionGuard } from '../permissions/e2e-restriction/e2e-restriction.guard';
import { AppLogger } from '../common/app-logger.service';
import { RegisterDto } from './dto/register.dto';

/**
 * RegisterCommand - Single Responsibility: Handle /register command
 *
 * Registers trackers for the guild.
 * Restricted to e2e testing environment only.
 */
@Injectable()
@UseGuards(E2ERestrictionGuard)
export class RegisterCommand {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(RegisterCommand.name);
  }

  @SlashCommand({
    name: 'register',
    description: 'Register trackers for the guild',
  })
  public async onRegister(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: RegisterDto,
  ): Promise<void> {
    const guildId = interaction.guildId || 'DM';
    const channelId = interaction.channelId || 'unknown';
    const userId = interaction.user.id;

    // Collect URLs into array, filtering out undefined/empty values
    const urls = [dto.url1, dto.url2, dto.url3, dto.url4].filter(
      (url): url is string => typeof url === 'string' && url.length > 0,
    );

    this.logger.log('Register command executed', {
      userId,
      guildId,
      channelId,
      commandName: 'register',
      urlCount: urls.length,
    });

    // TODO: Implement register trackers logic
    // This command should call apiService.registerTrackers() when implemented

    await interaction.reply({
      content: `Register command - implementation pending\nURLs provided: ${urls.length}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
