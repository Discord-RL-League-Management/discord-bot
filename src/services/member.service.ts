import { injectable, inject } from 'inversify';
import { GuildMember } from 'discord.js';
import { TYPES } from '../config/types';
import { ApiService } from './api.service';
import { logger } from '../utils/logger';
import { DiscordMemberAdapter } from '../adapters/discord-member.adapter';
import { MemberData, MemberUpdateData } from '../interfaces/member-data.interface';

/**
 * MemberService - Single Responsibility: Member business logic orchestration
 * 
 * Orchestrates member events: validate → call API → handle errors
 * No direct Discord API calls beyond validation
 */
@injectable()
export class MemberService {
  constructor(@inject(TYPES.ApiService) private readonly apiService: ApiService) {}

  /**
   * Handle member join event
   * Single Responsibility: Orchestrate member join flow
   */
  async handleMemberJoin(member: GuildMember): Promise<void> {
    const memberData = DiscordMemberAdapter.toMemberData(member);
    await this.processMemberJoin(memberData);
  }

  /**
   * Process member join with clean data
   * Single Responsibility: Business logic for member join
   */
  private async processMemberJoin(data: MemberData): Promise<void> {
    logger.info(`Member joined: ${data.username} in ${data.guildName}`);

    try {
      if (!this.isValidDiscordId(data.userId) || !this.isValidDiscordId(data.guildId)) {
        throw new Error('Invalid Discord ID format');
      }

      await this.apiService.createGuildMember(data.guildId, {
        userId: data.userId,
        username: data.username,
        roles: data.roles,
      });

      logger.success(`Successfully added member: ${data.username}`);
    } catch (error) {
      logger.error(`Error handling member join ${data.userId}:`, error);
      throw error;
    }
  }

  /**
   * Handle member leave event
   * Single Responsibility: Orchestrate member leave flow
   */
  async handleMemberLeave(member: GuildMember | Partial<GuildMember>): Promise<void> {
    const userId = member.user?.id;
    const username = member.user?.username || 'Unknown';
    const guildId = member.guild?.id;

    logger.info(`Member left: ${username} from ${member.guild?.name || 'guild'}`);

    try {
      if (!userId || !guildId) {
        throw new Error('Missing user or guild ID');
      }

      await this.apiService.removeGuildMember(guildId, userId);
      logger.success(`Successfully removed member: ${username}`);
    } catch (error) {
      logger.error(`Error handling member leave ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Handle member update event (role changes, username changes, etc.)
   * Single Responsibility: Orchestrate member update flow
   */
  async handleMemberUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    const updateData = DiscordMemberAdapter.toMemberUpdateData(oldMember, newMember);
    await this.processMemberUpdate(updateData);
  }

  /**
   * Process member update with clean data
   * Single Responsibility: Business logic for member update
   */
  private async processMemberUpdate(data: MemberUpdateData): Promise<void> {
    // Only update if roles actually changed
    const rolesChanged =
      data.oldRoles.length !== data.newRoles.length ||
      !data.oldRoles.every(role => data.newRoles.includes(role));

    if (rolesChanged) {
      logger.info(`Member roles updated: ${data.username} in ${data.guildName}`);

      try {
        const roles = data.newRoles.filter(roleId => roleId !== data.guildId);

        await this.apiService.updateGuildMember(data.guildId, data.userId, {
          username: data.username,
          roles,
        });

        logger.success(`Successfully updated member: ${data.username}`);
      } catch (error) {
        logger.error(`Error handling member update ${data.userId}:`, error);
        throw error;
      }
    }
  }

  /**
   * Validate Discord ID format
   * Single Responsibility: Validation only
   */
  private isValidDiscordId(id: string): boolean {
    return /^\d{17,20}$/.test(id);
  }
}
