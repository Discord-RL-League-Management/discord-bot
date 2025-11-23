// CRITICAL: Load environment variables FIRST before any imports
import dotenv from 'dotenv';
dotenv.config();

// CRITICAL: Import reflect-metadata before inversify
import 'reflect-metadata';

import { Client, GatewayIntentBits } from 'discord.js';
import { createContainer } from './config/container';
import { TYPES } from './config/types';
import { GuildService } from './services/guild.service';
import { MemberService } from './services/member.service';
import { ApiService } from './services/api.service';
import { ConfigService } from './services/config.service';
import { GuildSyncService } from './services/guild-sync.service';
import { CommandRegistryService } from './commands/command-registry.service';
import { CommandDeploymentService } from './commands/command-deployment.service';
import { ConfigCommand } from './commands/handlers/config.command';
import { HelpCommand } from './commands/handlers/help.command';
import { RegisterCommand } from './commands/handlers/register.command';
import { AddTrackerCommand } from './commands/handlers/add-tracker.command';
import { createGuildCreateEvent } from './events/guildCreate';
import { createGuildDeleteEvent } from './events/guildDelete';
import { createGuildMemberAddEvent } from './events/guildMemberAdd';
import { createGuildMemberRemoveEvent } from './events/guildMemberRemove';
import { createGuildMemberUpdateEvent } from './events/guildMemberUpdate';
import { createInteractionCreateEvent } from './events/interactionCreate';
import { PermissionValidatorService } from './services/permission-validator.service';
import { PermissionLoggerService } from './services/permission-logger.service';
import { CooldownService } from './services/cooldown.service';
import { logger } from './utils/logger';

// Create DI container
const container = createContainer();

// Get services from container
const guildService = container.get<GuildService>(TYPES.GuildService);
const memberService = container.get<MemberService>(TYPES.MemberService);
const apiService = container.get<ApiService>(TYPES.ApiService);
const guildSyncService = container.get<GuildSyncService>(TYPES.GuildSyncService);

// Get command services from container
const commandRegistry = container.get<CommandRegistryService>(TYPES.CommandRegistryService);
const commandDeployment = container.get<CommandDeploymentService>(TYPES.CommandDeploymentService);
const configCommand = container.get<ConfigCommand>(TYPES.ConfigCommand);
const helpCommand = container.get<HelpCommand>(TYPES.HelpCommand);
const registerCommand = container.get<RegisterCommand>(TYPES.RegisterCommand);
const addTrackerCommand = container.get<AddTrackerCommand>(TYPES.AddTrackerCommand);

// Get permission services from container
const permissionValidator = container.get<PermissionValidatorService>(TYPES.PermissionValidatorService);
const permissionLogger = container.get<PermissionLoggerService>(TYPES.PermissionLoggerService);

// Get cooldown service from container
const cooldownService = container.get<CooldownService>(TYPES.CooldownService);

// Register commands
commandRegistry.register(configCommand);
commandRegistry.register(helpCommand);
commandRegistry.register(registerCommand);
commandRegistry.register(addTrackerCommand);

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle Discord client errors
client.on('error', (error: Error) => {
  logger.error('Discord client error:', error);
});

// Handle warnings
client.on('warn', (info: string) => {
  logger.warn('Discord client warning:', info);
});

// Register guild event handlers with injected services
client.on('guildCreate', createGuildCreateEvent(guildService).execute);
client.on('guildDelete', createGuildDeleteEvent(guildService).execute);

// Register member event handlers with injected services
client.on('guildMemberAdd', createGuildMemberAddEvent(memberService).execute);
client.on('guildMemberRemove', createGuildMemberRemoveEvent(memberService).execute);
client.on('guildMemberUpdate', createGuildMemberUpdateEvent(memberService).execute);

// Register interaction handler with permission services
client.on('interactionCreate', createInteractionCreateEvent(commandRegistry, permissionValidator, permissionLogger, apiService, cooldownService).execute);

// Bot ready event - use 'clientReady' for Discord.js v14
client.once('ready', async () => {
  logger.success(`Logged in as ${client.user?.tag}`);
  
  // Test API connection
  try {
    const health = await apiService.healthCheck();
    logger.success('API connection successful:', health);
  } catch (error: any) {
    if (error instanceof Error && 'statusCode' in error) {
      logger.error('API connection failed:', {
        message: error.message,
        statusCode: (error as any).statusCode,
        code: (error as any).code,
      });
    } else {
      logger.error('API connection failed:', error.message);
    }
  }

  // Sync existing guilds with database
  try {
    logger.info('Starting guild sync...');
    const syncResult = await guildSyncService.syncAllGuilds(client);
    logger.success(
      `Guild sync complete: ${syncResult.synced}/${syncResult.total} guilds synced${syncResult.failed > 0 ? `, ${syncResult.failed} failed` : ''}`
    );
  } catch (error: any) {
    logger.error('Guild sync failed:', error);
    // Don't throw - sync failure shouldn't prevent bot from running
  }

  // Deploy slash commands
  try {
    logger.info('Deploying slash commands...');
    await commandDeployment.deployCommands(client.user!.id);
    logger.success('Slash commands deployed successfully');
  } catch (error: any) {
    logger.error('Failed to deploy slash commands:', error);
    // Don't throw - command deployment failure shouldn't prevent bot from running
  }
});

// Login to Discord
const configService = container.get<ConfigService>(TYPES.ConfigService);
client.login(configService.discordToken);
