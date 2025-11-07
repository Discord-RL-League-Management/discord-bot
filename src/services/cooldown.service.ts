import { injectable } from 'inversify';
import { logger } from '../utils/logger';

interface CooldownEntry {
  userId: string;
  commandName: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

/**
 * CooldownService - Single Responsibility: Manage command cooldowns
 * 
 * Tracks per-user command cooldowns using in-memory Map.
 * Automatically cleans up expired entries.
 */
@injectable()
export class CooldownService {
  private cooldowns: Map<string, CooldownEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval to remove expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if user is on cooldown for a command
   * @param userId - Discord user ID
   * @param commandName - Command name
   * @param cooldownSeconds - Cooldown duration in seconds
   * @returns Remaining cooldown seconds, or 0 if not on cooldown
   */
  checkCooldown(userId: string, commandName: string, cooldownSeconds: number): number {
    const key = this.getKey(userId, commandName);
    const entry = this.cooldowns.get(key);

    if (!entry) {
      return 0; // No cooldown
    }

    const now = Date.now();
    if (now >= entry.expiresAt) {
      // Expired, remove and allow
      this.cooldowns.delete(key);
      return 0;
    }

    // Still on cooldown
    const remainingSeconds = Math.ceil((entry.expiresAt - now) / 1000);
    return remainingSeconds;
  }

  /**
   * Set cooldown for user and command
   * @param userId - Discord user ID
   * @param commandName - Command name
   * @param cooldownSeconds - Cooldown duration in seconds
   */
  setCooldown(userId: string, commandName: string, cooldownSeconds: number): void {
    const key = this.getKey(userId, commandName);
    const expiresAt = Date.now() + cooldownSeconds * 1000;

    this.cooldowns.set(key, {
      userId,
      commandName,
      expiresAt,
    });

    logger.info(`Cooldown set for ${userId} on ${commandName}: ${cooldownSeconds}s`);
  }

  /**
   * Clear cooldown for user and command (if needed)
   */
  clearCooldown(userId: string, commandName: string): void {
    const key = this.getKey(userId, commandName);
    this.cooldowns.delete(key);
  }

  /**
   * Generate unique key for cooldown entry
   */
  private getKey(userId: string, commandName: string): string {
    return `${userId}:${commandName}`;
  }

  /**
   * Clean up expired cooldown entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cooldowns.entries()) {
      if (now >= entry.expiresAt) {
        this.cooldowns.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired cooldown entries`);
    }
  }

  /**
   * Cleanup on service destruction
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cooldowns.clear();
  }
}

