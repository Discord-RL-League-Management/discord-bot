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
  MemberService: Symbol.for('MemberService'),
  
  // Utility services
  ErrorClassificationService: Symbol.for('ErrorClassificationService'),
  ChannelFinderService: Symbol.for('ChannelFinderService'),
  GuildSyncService: Symbol.for('GuildSyncService'),
  
  // Command services
  CommandRegistryService: Symbol.for('CommandRegistryService'),
  CommandDeploymentService: Symbol.for('CommandDeploymentService'),
  ConfigCommand: Symbol.for('ConfigCommand'),
  HelpCommand: Symbol.for('HelpCommand'),
  RegisterCommand: Symbol.for('RegisterCommand'),
  AddTrackerCommand: Symbol.for('AddTrackerCommand'),
  
  // Permission services
  PermissionValidatorService: Symbol.for('PermissionValidatorService'),
  PermissionLoggerService: Symbol.for('PermissionLoggerService'),
  
  // Cooldown service
  CooldownService: Symbol.for('CooldownService'),
};

