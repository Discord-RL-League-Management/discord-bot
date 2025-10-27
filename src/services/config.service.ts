import { injectable } from 'inversify';
import { loadEnvironmentConfig, EnvironmentConfig } from '../config/environment';

/**
 * ConfigService - Single Responsibility: Validated configuration access
 * 
 * Loads and validates environment variables using zod schema.
 * Throws error on startup if config is invalid (fail fast).
 */
@injectable()
export class ConfigService {
  private readonly config: EnvironmentConfig;

  constructor() {
    this.config = loadEnvironmentConfig();
  }

  get discordToken(): string {
    return this.config.DISCORD_TOKEN;
  }

  get apiBaseUrl(): string {
    return this.config.API_BASE_URL;
  }

  get apiKey(): string {
    return this.config.API_KEY;
  }
}

