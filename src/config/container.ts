import { Container } from 'inversify';
import { TYPES } from './types';

// Services
import { ConfigService } from '../services/config.service';
import { ApiService } from '../services/api.service';
import { GuildService } from '../services/guild.service';
import { MemberService } from '../services/member.service';
import { DiscordMessageService } from '../services/discord-message.service';
import { DiscordChannelService } from '../services/discord-channel.service';
import { NotificationService } from '../services/notification.service';
import { ErrorClassificationService } from '../services/error-classification.service';
import { ChannelFinderService } from '../services/channel-finder.service';
import { GuildSyncService } from '../services/guild-sync.service';

// Command services
import { CommandRegistryService } from '../commands/command-registry.service';
import { CommandDeploymentService } from '../commands/command-deployment.service';
import { ConfigCommand } from '../commands/handlers/config.command';
import { HelpCommand } from '../commands/handlers/help.command';
import { RegisterCommand } from '../commands/handlers/register.command';
import { AddTrackerCommand } from '../commands/handlers/add-tracker.command';

// Permission services
import { PermissionValidatorService } from '../services/permission-validator.service';
import { PermissionLoggerService } from '../services/permission-logger.service';

// Cooldown service
import { CooldownService } from '../services/cooldown.service';

/**
 * Dependency Injection Container Setup
 * 
 * Configures InversifyJS container with all service bindings.
 * All services are bound as singletons (default InversifyJS behavior).
 */
export function createContainer(): Container {
  const container = new Container();

  // Bind services in dependency order
  container.bind<ConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();
  container.bind<ApiService>(TYPES.ApiService).to(ApiService).inSingletonScope();
  container.bind<ErrorClassificationService>(TYPES.ErrorClassificationService).to(ErrorClassificationService).inSingletonScope();
  container.bind<ChannelFinderService>(TYPES.ChannelFinderService).to(ChannelFinderService).inSingletonScope();
  container.bind<GuildSyncService>(TYPES.GuildSyncService).to(GuildSyncService).inSingletonScope();
  container.bind<DiscordMessageService>(TYPES.DiscordMessageService).to(DiscordMessageService).inSingletonScope();
  container.bind<DiscordChannelService>(TYPES.DiscordChannelService).to(DiscordChannelService).inSingletonScope();
  container.bind<NotificationService>(TYPES.NotificationService).to(NotificationService).inSingletonScope();
  container.bind<GuildService>(TYPES.GuildService).to(GuildService).inSingletonScope();
  container.bind<MemberService>(TYPES.MemberService).to(MemberService).inSingletonScope();

  // Command services
  container.bind<CommandRegistryService>(TYPES.CommandRegistryService).to(CommandRegistryService).inSingletonScope();
  container.bind<CommandDeploymentService>(TYPES.CommandDeploymentService).to(CommandDeploymentService).inSingletonScope();
  container.bind<ConfigCommand>(TYPES.ConfigCommand).to(ConfigCommand).inSingletonScope();
  container.bind<HelpCommand>(TYPES.HelpCommand).to(HelpCommand).inSingletonScope();
  container.bind<RegisterCommand>(TYPES.RegisterCommand).to(RegisterCommand).inSingletonScope();
  container.bind<AddTrackerCommand>(TYPES.AddTrackerCommand).to(AddTrackerCommand).inSingletonScope();

  // Permission services
  container.bind<PermissionValidatorService>(TYPES.PermissionValidatorService).to(PermissionValidatorService).inSingletonScope();
  container.bind<PermissionLoggerService>(TYPES.PermissionLoggerService).to(PermissionLoggerService).inSingletonScope();

  // Cooldown service
  container.bind<CooldownService>(TYPES.CooldownService).to(CooldownService).inSingletonScope();

  return container;
}

