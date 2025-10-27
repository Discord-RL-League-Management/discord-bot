import { Container } from 'inversify';
import { TYPES } from './types';

// Services
import { ConfigService } from '../services/config.service';
import { ApiService } from '../services/api.service';
import { GuildService } from '../services/guild.service';
import { DiscordMessageService } from '../services/discord-message.service';
import { DiscordChannelService } from '../services/discord-channel.service';
import { NotificationService } from '../services/notification.service';

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
  container.bind<DiscordMessageService>(TYPES.DiscordMessageService).to(DiscordMessageService).inSingletonScope();
  container.bind<DiscordChannelService>(TYPES.DiscordChannelService).to(DiscordChannelService).inSingletonScope();
  container.bind<NotificationService>(TYPES.NotificationService).to(NotificationService).inSingletonScope();
  container.bind<GuildService>(TYPES.GuildService).to(GuildService).inSingletonScope();

  return container;
}

