// CRITICAL: Load environment variables FIRST before any imports
import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits, TextChannel, Message, Collection } from 'discord.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from './logger';

/**
 * Temporary utility function to export messages from specific channels
 * Exports the 1000 most recent messages from each channel to a text file
 */

const GUILD_ID = '1352451711431737394';
const CHANNELS = {
  staffChat: '1376788579745009674',
  adminChat: '1404190125126189206',
  bodChat: '1394127361578106930',
};

const MESSAGE_LIMIT = 1000;

async function exportMessages() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
    ],
  });

  try {
    logger.info('Starting message export...');
    
    // Login to Discord
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      logger.error('DISCORD_TOKEN environment variable is not set');
      process.exit(1);
    }

    await client.login(token);
    logger.info('Waiting for client to be ready...');

    // Wait for client to be ready
    await new Promise<void>((resolve) => {
      client.once('ready', () => {
        logger.success(`Logged in as ${client.user?.tag}`);
        resolve();
      });
    });

    const guild = await client.guilds.fetch(GUILD_ID);
    if (!guild) {
      logger.error(`Guild ${GUILD_ID} not found`);
      await client.destroy();
      process.exit(1);
    }

    const outputDir = path.join(process.cwd(), 'message-exports');
    await fs.mkdir(outputDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `messages-${timestamp}.txt`);

    let outputContent = `Message Export - ${new Date().toISOString()}\n`;
    outputContent += `Guild: ${guild.name} (${GUILD_ID})\n`;
    outputContent += `${'='.repeat(80)}\n\n`;

    for (const [channelName, channelId] of Object.entries(CHANNELS)) {
      try {
        logger.info(`Fetching messages from ${channelName} (${channelId})...`);
        
        const channel = await client.channels.fetch(channelId);
        
        if (!channel || !channel.isTextBased() || channel.isDMBased()) {
          logger.warn(`Channel ${channelId} is not a valid text channel`);
          outputContent += `\n[${channelName.toUpperCase()}] - Invalid channel\n\n`;
          continue;
        }

        const textChannel = channel as TextChannel;
        const messages: string[] = [];
        let lastMessageId: string | undefined;
        let messageCount = 0;

        // Fetch messages in batches (Discord API limit is 100 per request)
        while (messageCount < MESSAGE_LIMIT) {
          const batchSize = Math.min(100, MESSAGE_LIMIT - messageCount);
          const options: { limit: number; before?: string } = { limit: batchSize };
          
          if (lastMessageId) {
            options.before = lastMessageId;
          }

          const fetched = await textChannel.messages.fetch(options);
          
          if (fetched.size === 0) {
            break; // No more messages
          }

          // Convert to array and sort by timestamp (oldest first for this batch)
          const batchMessages: Message[] = Array.from(fetched.values())
            .sort((a: Message, b: Message) => a.createdTimestamp - b.createdTimestamp);

          for (const message of batchMessages) {
            const date = new Date(message.createdTimestamp).toISOString();
            const author = message.author.tag;
            const content = message.content || '[No content]';
            const attachments = message.attachments.size > 0 
              ? ` [${Array.from(message.attachments.values()).map((a) => a.url).join(', ')}]`
              : '';
            
            messages.push(`[${date}] ${author}: ${content}${attachments}`);
            messageCount++;
          }

          // Set last message ID for next batch (get the oldest message from the sorted array)
          lastMessageId = batchMessages[0]?.id;

          if (fetched.size < batchSize) {
            break; // No more messages available
          }

          // Rate limiting: small delay between batches
          await new Promise(resolve => setTimeout(resolve, 250));
        }

        // Reverse messages to show newest first in output
        messages.reverse();

        outputContent += `\n[${channelName.toUpperCase()}] - ${textChannel.name} (${channelId})\n`;
        outputContent += `Total messages exported: ${messages.length}\n`;
        outputContent += `${'-'.repeat(80)}\n`;
        outputContent += messages.join('\n');
        outputContent += `\n${'='.repeat(80)}\n\n`;

        logger.success(`Exported ${messages.length} messages from ${channelName}`);
      } catch (error: any) {
        logger.error(`Error fetching messages from ${channelName}:`, error);
        outputContent += `\n[${channelName.toUpperCase()}] - Error: ${error.message}\n\n`;
      }
    }

    // Write to file
    await fs.writeFile(outputFile, outputContent, 'utf-8');
    logger.success(`Message export complete! File saved to: ${outputFile}`);
    
    // Also log file size
    const stats = await fs.stat(outputFile);
    logger.info(`Export file size: ${(stats.size / 1024).toFixed(2)} KB`);

    // Clean up and exit
    await client.destroy();
    process.exit(0);

  } catch (error: any) {
    logger.error('Error during message export:', error);
    await client.destroy();
    process.exit(1);
  }
}

// Run the export
exportMessages();
