import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { ConfigSchema } from './config.schema';

@Injectable()
export class ConfigService {
  constructor(
    private readonly nestConfigService: NestConfigService<ConfigSchema>,
  ) {}

  getDiscordToken(): string {
    const value = this.nestConfigService.get<string>('DISCORD_TOKEN', {
      infer: true,
    });
    if (!value) {
      throw new Error(
        'DISCORD_TOKEN is required but was not found in configuration',
      );
    }
    return value;
  }

  getApiBaseUrl(): string {
    const explicitUrl = this.nestConfigService.get<string>('API_BASE_URL', {
      infer: true,
    });
    if (explicitUrl) {
      return explicitUrl;
    }

    const protocol =
      this.nestConfigService.get<'http' | 'https'>('API_PROTOCOL', {
        infer: true,
      }) ?? 'http';
    const host =
      this.nestConfigService.get<string>('API_HOST', {
        infer: true,
      }) ?? 'localhost';
    const port = this.nestConfigService.get<string>('API_PORT', {
      infer: true,
    });

    const defaultPort = protocol === 'https' ? '443' : '3000';
    const finalPort = port || defaultPort;

    if (protocol === 'https' && finalPort === '443') {
      return `${protocol}://${host}`;
    }
    if (protocol === 'http' && finalPort === '80') {
      return `${protocol}://${host}`;
    }
    return `${protocol}://${host}:${finalPort}`;
  }

  getApiKey(): string {
    const value = this.nestConfigService.get<string>('BOT_API_KEY', {
      infer: true,
    });
    if (!value) {
      throw new Error(
        'BOT_API_KEY is required but was not found in configuration',
      );
    }
    return value;
  }

  getDashboardUrl(): string | undefined {
    const value = this.nestConfigService.get<string>('DASHBOARD_URL', {
      infer: true,
    });
    return value === '' ? undefined : value;
  }

  getNodeEnv(): 'development' | 'production' | 'test' {
    const nodeEnv = this.nestConfigService.get<
      'development' | 'production' | 'test'
    >('NODE_ENV', { infer: true });
    return (nodeEnv ?? 'development') as 'development' | 'production' | 'test';
  }

  getBotPort(): number {
    const port = this.nestConfigService.get<string>('BOT_PORT', {
      infer: true,
    });
    if (port) {
      const parsedPort = parseInt(port, 10);
      if (!isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
        return parsedPort;
      }
    }
    // Default to 3001 to avoid conflict with API on 3000
    return 3001;
  }
}
