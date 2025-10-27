import { injectable, inject } from 'inversify';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError, HealthCheckResponse, CreateGuildDto } from '@league-management/shared-types';
import { ConfigService } from './config.service';
import { logger } from '../utils/logger';

/**
 * ApiService - Single Responsibility: HTTP communication with league-api only
 * 
 * Refactored from APIClient class.
 * Returns raw API responses (no business logic).
 * Uses axios interceptor for error transformation.
 */
@injectable()
export class ApiService {
  private client: AxiosInstance;

  constructor(@inject(ConfigService) private configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.configService.apiBaseUrl,
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${this.configService.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          message: 'API request failed',
          statusCode: error.response?.status,
        };

        if (error.response?.data) {
          const errorData = error.response.data as any;
          apiError.message = errorData.message || errorData.error || error.message;
          apiError.code = errorData.code;
          apiError.details = errorData.details;
        }

        throw apiError;
      }
    );
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await this.client.get('/internal/health');
      return response.data;
    } catch (error: any) {
      logger.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Create guild in database
   */
  async createGuild(guildData: CreateGuildDto): Promise<any> {
    try {
      const response = await this.client.post('/internal/guilds', guildData);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to create guild:', error);
      throw error;
    }
  }

  /**
   * Remove guild from database (soft delete)
   */
  async removeGuild(guildId: string): Promise<any> {
    try {
      const response = await this.client.delete(`/internal/guilds/${guildId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to remove guild ${guildId}:`, error);
      throw error;
    }
  }
}

