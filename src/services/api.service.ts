import { injectable, inject } from 'inversify';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError, HealthCheckResponse, CreateGuildDto } from '@league-management/shared-types';
import { ConfigService } from './config.service';
import { TYPES } from '../config/types';
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

  constructor(@inject(TYPES.ConfigService) private configService: ConfigService) {
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
   * Upsert guild in database (create or update)
   * Single Responsibility: HTTP call to upsert guild
   */
  async upsertGuild(guildData: CreateGuildDto): Promise<any> {
    try {
      const response = await this.client.post('/internal/guilds/upsert', guildData);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to upsert guild:', error);
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

  /**
   * Create guild member in database
   * Single Responsibility: HTTP call to create member
   */
  async createGuildMember(guildId: string, memberData: {
    userId: string;
    username: string;
    roles: string[];
  }): Promise<any> {
    try {
      const response = await this.client.post(
        `/internal/guilds/${guildId}/members`,
        memberData
      );
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to create guild member ${memberData.userId}:`, error);
      throw error;
    }
  }

  /**
   * Update guild member in database
   * Single Responsibility: HTTP call to update member
   */
  async updateGuildMember(
    guildId: string,
    userId: string,
    updateData: Partial<{ username: string; roles: string[] }>
  ): Promise<any> {
    try {
      const response = await this.client.patch(
        `/internal/guilds/${guildId}/members/${userId}`,
        updateData
      );
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to update guild member ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Remove guild member from database
   * Single Responsibility: HTTP call to remove member
   */
  async removeGuildMember(guildId: string, userId: string): Promise<any> {
    try {
      const response = await this.client.delete(
        `/internal/guilds/${guildId}/members/${userId}`
      );
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to remove guild member ${userId}:`, error);
      throw error;
    }
  }
}

