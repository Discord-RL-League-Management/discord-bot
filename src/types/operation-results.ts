/**
 * Operation result types for tracking success/failure
 * Single Responsibility: Type definitions for operation results
 */

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  errors: Array<{ guildId: string; error: any }>;
}

export interface GuildJoinResult {
  success: boolean;
  guildCreated: boolean;
  welcomeSent: boolean;
  error?: any;
}











