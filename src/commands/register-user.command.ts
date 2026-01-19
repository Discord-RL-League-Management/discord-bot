import { Injectable, UseGuards } from '@nestjs/common';
import { SlashCommand, Context, Options } from 'necord';
import type { SlashCommandContext } from 'necord';
import { MessageFlags } from 'discord.js';
import { E2ERestrictionGuard } from '../permissions/e2e-restriction/e2e-restriction.guard';
import { AppLogger } from '../common/app-logger.service';
import { RegisterUserDto } from './dto/register-user.dto';

/**
 * RegisterUserCommand - Single Responsibility: Handle /register-user command
 *
 * Registers a user's trackers.
 * Restricted to e2e testing environment only.
 */
@Injectable()
@UseGuards(E2ERestrictionGuard)
export class RegisterUserCommand {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(RegisterUserCommand.name);
  }

  @SlashCommand({
    name: 'register-user',
    description: 'Register trackers for a user',
  })
  public async onRegisterUser(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: RegisterUserDto,
  ): Promise<void> {
    const guildId = interaction.guildId || 'DM';
    const channelId = interaction.channelId || 'unknown';
    const userId = interaction.user.id;

    // Collect URLs into array, filtering out undefined/empty values
    const urls = [dto.url1, dto.url2, dto.url3, dto.url4].filter(
      (url): url is string => typeof url === 'string' && url.length > 0,
    );

    this.logger.log('Register-user command executed', {
      userId,
      guildId,
      channelId,
      commandName: 'register-user',
      targetUserId: dto.user.id,
      urlCount: urls.length,
    });

    // TODO: Implement register user trackers logic
    // This command should call the appropriate API method when implemented

    await interaction.reply({
      content: `Register-user command - implementation pending\nUser: ${dto.user.tag}\nURLs provided: ${urls.length}`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
