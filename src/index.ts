// CRITICAL: Load environment variables FIRST before any imports
import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import { APIClient, ApiError } from './client';
import { guildCreateEvent } from './events/guildCreate';
import { guildDeleteEvent } from './events/guildDelete';

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// Create API client AFTER imports (not as module-level export)
const apiClient = new APIClient();

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle Discord client errors
client.on('error', (error: Error) => {
  console.error('Discord client error:', error);
});

// Handle warnings
client.on('warn', (info: string) => {
  console.warn('Discord client warning:', info);
});

// Register guild event handlers
client.on('guildCreate', guildCreateEvent.execute);
client.on('guildDelete', guildDeleteEvent.execute);

// Bot ready event - use 'clientReady' for Discord.js v14
client.once('clientReady', async () => {
  console.log(`Logged in as ${client.user?.tag}`);
  
  // Test API connection
  try {
    const health = await apiClient.healthCheck();
    console.log('✅ API connection successful:', health);
  } catch (error: any) {
    if (error instanceof Error && 'statusCode' in error) {
      const apiError = error as ApiError;
      console.error('❌ API connection failed:', {
        message: apiError.message,
        statusCode: apiError.statusCode,
        code: apiError.code,
      });
    } else {
      console.error('❌ API connection failed:', error.message);
    }
  }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
