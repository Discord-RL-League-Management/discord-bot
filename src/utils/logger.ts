/**
 * Centralized logger utility with New Relic integration
 * Sends logs to New Relic Logs API and outputs to console
 */

import axios from 'axios';
import * as os from 'os';

enum LogLevel {
  INFO = 'info',
  SUCCESS = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class NewRelicLogger {
  private readonly apiKey: string;
  private readonly enabled: boolean;
  private readonly logEndpoint: string;
  private readonly serviceName: string;
  private readonly hostname: string;

  constructor() {
    this.apiKey = process.env.NEW_RELIC_LICENSE_KEY || '';
    this.enabled = process.env.NEW_RELIC_ENABLED !== 'false' && !!this.apiKey;
    this.serviceName = process.env.NEW_RELIC_APP_NAME || 'League Discord Bot';
    this.hostname = os.hostname();
    // Support EU region: use log-api.eu.newrelic.com for EU accounts
    const region = process.env.NEW_RELIC_REGION || 'us';
    this.logEndpoint = region === 'eu' 
      ? 'https://log-api.eu.newrelic.com/log/v1'
      : 'https://log-api.newrelic.com/log/v1';
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private async sendToNewRelic(level: string, message: string, context?: string, ...args: any[]): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const logEntry: any = {
        timestamp: Date.now(),
        level,
        message: typeof message === 'string' ? message : JSON.stringify(message),
        'service.name': this.serviceName,
        hostname: this.hostname,
        'labels.name': context || this.serviceName,
      };

      // Add metadata if provided
      if (args.length > 0) {
        Object.assign(logEntry, { data: args });
      }

      await axios.post(
        this.logEndpoint,
        [logEntry],
        {
          headers: {
            'X-License-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 second timeout
        },
      );
    } catch (error: any) {
      // Silently fail to avoid log recursion
      // Only log connection errors in development, and only once to avoid spam
      if (process.env.NODE_ENV === 'development' && error?.code === 'ECONNREFUSED') {
        if (!(this as any)._connectionErrorLogged) {
          console.warn('⚠️  New Relic connection failed. This may be a network/firewall issue. Logs will continue to console only.');
          (this as any)._connectionErrorLogged = true;
        }
      }
    }
  }

  private log(level: string, emoji: string, ...args: any[]): void {
    const timestamp = this.getTimestamp();
    const message = args.length > 0 ? args[0] : '';
    const restArgs = args.slice(1);

    // Send to New Relic (no context for discord bot logs)
    this.sendToNewRelic(level, message, undefined, ...restArgs).catch(() => {
      // Silently handle errors to avoid recursion
    });

    // Also log to console
    console.log(`[${timestamp}] ${emoji} ${level.toUpperCase().padEnd(7)}`, ...args);
  }

  info = (...args: any[]) => this.log(LogLevel.INFO, 'ℹ️ ', ...args);
  success = (...args: any[]) => this.log(LogLevel.SUCCESS, '✅', ...args);
  warn = (...args: any[]) => this.log(LogLevel.WARN, '⚠️ ', ...args);
  error = (...args: any[]) => this.log(LogLevel.ERROR, '❌', ...args);
}

export const logger = new NewRelicLogger();

