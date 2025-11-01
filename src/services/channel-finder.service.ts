import { injectable } from 'inversify';
import { Guild, TextChannel, ChannelType } from 'discord.js';
import { logger } from '../utils/logger';

/**
 * ChannelFinderService - Single Responsibility: Finding appropriate channels using configurable strategies
 * 
 * Handles channel finding logic with fallback strategies.
 * Extensible: Strategy pattern allows adding new finders (e.g., config-based).
 */
@injectable()
export class ChannelFinderService {
  /**
   * Find welcome channel using fallback strategy
   * Single Responsibility: Channel finding with fallback logic
   * 
   * Fallback strategy:
   * 1. Channel named "general" (current behavior)
   * 2. First text channel bot can send messages to
   * 3. First text channel in guild (by position)
   */
  findWelcomeChannel(guild: Guild): TextChannel | null {
    try {
      // Strategy 1: Find channel named "general"
      const generalChannel = this.findChannelByName(guild, 'general');
      if (generalChannel) {
        logger.info(`Found general channel in ${guild.name}`);
        return generalChannel;
      }

      // Strategy 2: Find first text channel bot can send messages to
      const accessibleChannel = this.findAccessibleTextChannel(guild);
      if (accessibleChannel) {
        logger.info(`Found accessible text channel in ${guild.name}`);
        return accessibleChannel;
      }

      // Strategy 3: Find first text channel by position
      const firstChannel = this.findFirstTextChannel(guild);
      if (firstChannel) {
        logger.info(`Found first text channel in ${guild.name}`);
        return firstChannel;
      }

      logger.warn(`No suitable welcome channel found in ${guild.name}`);
      return null;
    } catch (error) {
      logger.error(`Error finding welcome channel in ${guild.name}:`, error);
      return null;
    }
  }

  /**
   * Find channel by name (case-insensitive)
   * Single Responsibility: Channel name matching
   */
  private findChannelByName(guild: Guild, name: string): TextChannel | null {
    const channel = guild.channels.cache.find(
      (channel) =>
        channel.type === ChannelType.GuildText &&
        channel.name.toLowerCase().includes(name.toLowerCase())
    ) as TextChannel | undefined;

    return channel || null;
  }

  /**
   * Find first text channel bot can send messages to
   * Single Responsibility: Accessible channel finding
   */
  private findAccessibleTextChannel(guild: Guild): TextChannel | null {
    // Filter text channels the bot can access
    const accessibleChannels = guild.channels.cache
      .filter(
        (channel) =>
          channel.type === ChannelType.GuildText &&
          channel.permissionsFor(guild.members.me!)?.has('SendMessages')
      )
      .map((channel) => channel as TextChannel)
      .sort((a, b) => a.position - b.position);

    return accessibleChannels.length > 0 ? accessibleChannels[0] : null;
  }

  /**
   * Find first text channel by position
   * Single Responsibility: Default channel selection
   */
  private findFirstTextChannel(guild: Guild): TextChannel | null {
    const textChannels = guild.channels.cache
      .filter((channel) => channel.type === ChannelType.GuildText)
      .map((channel) => channel as TextChannel)
      .sort((a, b) => a.position - b.position);

    return textChannels.length > 0 ? textChannels[0] : null;
  }
}
