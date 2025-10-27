/**
 * Centralized logger utility
 * Replaces all console.log/error/warn calls with structured logging
 */

enum LogLevel {
  INFO = 'INFO   ',
  SUCCESS = 'SUCCESS',
  WARN = 'WARN   ',
  ERROR = 'ERROR  ',
}

function getTimestamp(): string {
  return new Date().toISOString();
}

function log(level: string, emoji: string, ...args: any[]): void {
  const timestamp = getTimestamp();
  console.log(`[${timestamp}] ${emoji} ${level}`, ...args);
}

export const logger = {
  info: (...args: any[]) => log(LogLevel.INFO, 'ℹ️ ', ...args),
  success: (...args: any[]) => log(LogLevel.SUCCESS, '✅', ...args),
  warn: (...args: any[]) => log(LogLevel.WARN, '⚠️ ', ...args),
  error: (...args: any[]) => log(LogLevel.ERROR, '❌', ...args),
};

