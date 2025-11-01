import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CommandMetadata } from './interfaces/command-metadata.interface';

/**
 * Command Interface - Single Responsibility: Define command contract
 * 
 * All slash commands implement this interface for consistency.
 * Enables easy addition of new commands without modifying existing code.
 * 
 * Open/Closed Principle: Extensible with optional metadata field without breaking existing commands
 */
export interface ICommand {
  data: SlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  
  /**
   * Optional metadata for permission requirements and categorization
   * Commands without metadata default to 'public' category
   */
  metadata?: CommandMetadata;
}


