/**
 * Dependency Injection Type Symbols
 * 
 * Used to identify services in the DI container.
 * Prevents string-based injection which can lead to typos.
 */

export const TYPES = {
  // Core services
  ConfigService: Symbol.for('ConfigService'),
  ApiService: Symbol.for('ApiService'),
  
  // Discord services
  DiscordMessageService: Symbol.for('DiscordMessageService'),
  DiscordChannelService: Symbol.for('DiscordChannelService'),
  NotificationService: Symbol.for('NotificationService'),
  
  // Business logic services
  GuildService: Symbol.for('GuildService'),
};

