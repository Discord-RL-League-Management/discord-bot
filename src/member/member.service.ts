import { Injectable } from '@nestjs/common';
import { GuildMember, PartialGuildMember } from 'discord.js';
import { ApiService } from '../api/api.service';
import { validateDiscordId } from '../common/utils/discord-id.validator';
import { AppLogger } from '../common/app-logger.service';

/**
 * MemberService - Single Responsibility: Member business logic orchestration
 *
 * Orchestrates member events: validate → call API → handle errors
 * No direct Discord API calls beyond validation
 */
@Injectable()
export class MemberService {
  constructor(
    private readonly logger: AppLogger,
    private readonly apiService: ApiService,
  ) {
    this.logger.setContext(MemberService.name);
  }

  /**
   * Handle member join event
   * Single Responsibility: Orchestrate member join flow
   */
  async handleMemberJoin(member: GuildMember): Promise<void> {
    if (member.user.bot) {
      this.logger.log(`Skipping bot join: ${member.user.username}`);
      return;
    }

    this.logger.log(
      `Member joined: ${member.user.username} in ${member.guild.name}`,
    );

    try {
      validateDiscordId(member.user.id);
      validateDiscordId(member.guild.id);

      const roles = Array.from(member.roles.cache.keys()).filter(
        (roleId) => roleId !== member.guild.id,
      ); // Exclude @everyone role

      await this.apiService.createGuildMember(member.guild.id, {
        userId: member.user.id,
        username: member.user.username,
        nickname: member.nickname || undefined,
        roles,
      });

      this.logger.log(`Successfully added member: ${member.user.username}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error handling member join ${member.user.id}:`,
        errorMessage,
      );
      throw error;
    }
  }

  /**
   * Handle member leave event
   * Single Responsibility: Orchestrate member leave flow
   */
  async handleMemberLeave(
    member: GuildMember | PartialGuildMember,
  ): Promise<void> {
    const userId = member.user?.id;
    const username = member.user?.username || 'Unknown';
    const guildId = member.guild?.id;

    this.logger.log(
      `Member left: ${username} from ${member.guild?.name || 'guild'}`,
    );

    try {
      if (!userId || !guildId) {
        throw new Error('Missing user or guild ID');
      }

      validateDiscordId(userId);
      validateDiscordId(guildId);

      await this.apiService.removeGuildMember(guildId, userId);

      this.logger.log(`Successfully removed member: ${username}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling member leave ${userId}:`, errorMessage);
      throw error;
    }
  }

  /**
   * Handle member update event (role changes, username changes, etc.)
   * Single Responsibility: Orchestrate member update flow
   */
  async handleMemberUpdate(
    oldMember: GuildMember,
    newMember: GuildMember,
  ): Promise<void> {
    if (newMember.user.bot) {
      this.logger.log(`Skipping bot update: ${newMember.user.username}`);
      return;
    }

    // Only update if roles actually changed
    const oldRoles = Array.from(oldMember.roles.cache.keys());
    const newRoles = Array.from(newMember.roles.cache.keys());

    const rolesChanged =
      oldRoles.length !== newRoles.length ||
      !oldRoles.every((role) => newRoles.includes(role)) ||
      oldMember.user.username !== newMember.user.username ||
      oldMember.nickname !== newMember.nickname;

    if (rolesChanged) {
      this.logger.log(
        `Member updated: ${newMember.user.username} in ${newMember.guild.name}`,
      );

      try {
        validateDiscordId(newMember.user.id);
        validateDiscordId(newMember.guild.id);

        const roles = newRoles.filter(
          (roleId) => roleId !== newMember.guild.id,
        ); // Exclude @everyone role

        await this.apiService.updateGuildMember(
          newMember.guild.id,
          newMember.user.id,
          {
            username: newMember.user.username,
            nickname: newMember.nickname || undefined,
            roles,
          },
        );

        this.logger.log(
          `Successfully updated member: ${newMember.user.username}`,
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Error handling member update ${newMember.user.id}:`,
          errorMessage,
        );
        throw error;
      }
    }
  }
}
