// CRITICAL: Load environment variables FIRST before any imports
import dotenv from 'dotenv';
dotenv.config();

// CRITICAL: Import reflect-metadata before inversify
import 'reflect-metadata';

import { Client, GatewayIntentBits } from 'discord.js';
import { createContainer } from './config/container';
import { TYPES } from './config/types';
import { GuildService } from './services/guild.service';
import { ApiService } from './services/api.service';
import { ConfigService } from './services/config.service';
import { createGuildCreateEvent } from './events/guildCreate';
import { createGuildDeleteEvent } from './events/guildDelete';
import { logger } from './utils/logger';

// Create DI container
const container = createContainer();

// Get services from container
const guildService = container.get<GuildService>(TYPES.GuildService);
const apiService = container.get<ApiService>(TYPES.ApiService);

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
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
});

// Login to Discord
const configService = container.get<ConfigService>(TYPES.ConfigService);
client.login(configService.discordToken);
