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
    const value = this.nestConfigService.get<string>('API_BASE_URL', {
      infer: true,
    });
    if (!value) {
      throw new Error(
        'API_BASE_URL is required but was not found in configuration',
      );
    }
    return value;
  }

  getApiKey(): string {
    const value = this.nestConfigService.get<string>('API_KEY', {
      infer: true,
    });
    if (!value) {
      throw new Error('API_KEY is required but was not found in configuration');
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
}
