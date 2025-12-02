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
      // Enhanced error logging with full context
      logger.error('Failed to upsert guild:', {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        details: error.details,
        response: error.response?.data,
        request: {
          url: '/internal/guilds/upsert',
          method: 'POST',
          payload: {
            id: guildData.id,
            name: guildData.name,
            ownerId: guildData.ownerId,
            memberCount: guildData.memberCount,
            icon: guildData.icon || undefined,
          },
        },
      });
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
    nickname?: string;
    roles: string[];
  }): Promise<any> {
    try {
      const response = await this.client.post(
        `/internal/guild-members`,
        {
          ...memberData,
          guildId,
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to create guild member ${memberData.userId}:`, error);
      throw error;
    }
  }

  /**
   * Atomically sync guild with all members (for bot startup)
   * Single Responsibility: HTTP call to atomic guild+member sync
   * 
   * This endpoint combines guild upsert and member sync in a single
   * database transaction, eliminating race conditions during bot startup.
   */
  async syncGuildWithMembers(
    guildId: string,
    guildData: CreateGuildDto,
    members: Array<{ userId: string; username: string; nickname?: string; roles: string[] }>,
  ): Promise<any> {
    return this.syncGuildWithMembersAndRoles(guildId, guildData, members);
  }

  /**
   * Atomically sync guild with all members and roles (for bot startup)
   * Single Responsibility: HTTP call to atomic guild+member+role sync
   * 
   * This endpoint combines guild upsert, member sync, and role configuration
   * in a single database transaction.
   */
  async syncGuildWithMembersAndRoles(
    guildId: string,
    guildData: CreateGuildDto,
    members: Array<{ userId: string; username: string; nickname?: string; roles: string[] }>,
    rolesData?: { admin: Array<{ id: string; name: string }> },
  ): Promise<any> {
    try {
      const response = await this.client.post(
        `/internal/guilds/${guildId}/sync`,
        {
          guild: guildData,
          members,
          roles: rolesData,
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to sync guild with members and roles for guild ${guildId}:`, {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
        details: error.details,
        request: {
          url: `/internal/guilds/${guildId}/sync`,
          method: 'POST',
          payload: {
            guildId,
            guild: {
              id: guildData.id,
              name: guildData.name,
              ownerId: guildData.ownerId,
              memberCount: guildData.memberCount,
              icon: guildData.icon || undefined,
            },
            memberCount: members.length,
            rolesProvided: !!rolesData,
          },
        },
      });
      throw error;
    }
  }

  /**
   * Sync all guild members (bulk operation)
   * Single Responsibility: HTTP call to sync members
   * 
   * Note: This method is for incremental syncs when the guild already exists.
   * For bot startup sync, use syncGuildWithMembers() instead to avoid race conditions.
   * The endpoint /internal/guild-members/:guildId/sync is still used for
   * incremental member updates and admin endpoints.
   */
  async syncGuildMembers(
    guildId: string,
    members: Array<{ userId: string; username: string; nickname?: string; roles: string[] }>
  ): Promise<any> {
    try {
      const response = await this.client.post(
        `/internal/guild-members/${guildId}/sync`,
        { members }
      );
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to sync guild members for guild ${guildId}:`, error);
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
    updateData: Partial<{ username: string; nickname?: string; roles: string[] }>
  ): Promise<any> {
    try {
      const response = await this.client.patch(
        `/internal/guild-members/${guildId}/users/${userId}`,
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
        `/internal/guild-members/${guildId}/users/${userId}`
      );
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to remove guild member ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get guild settings from database
   * Single Responsibility: HTTP call to get settings
   */
  async getGuildSettings(guildId: string): Promise<any> {
    try {
      const response = await this.client.get(`/internal/guilds/${guildId}/settings`);
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to get guild settings ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Register multiple trackers for a user (1-4 trackers)
   * Single Responsibility: HTTP call to register multiple trackers
   */
  async registerTrackers(
    userId: string,
    urls: string[],
    userData?: { username: string; globalName?: string; avatar?: string },
    channelId?: string,
    interactionToken?: string,
  ): Promise<any> {
    try {
      const response = await this.client.post('/internal/trackers/register-multiple', {
        userId,
        urls,
        userData,
        channelId,
        interactionToken,
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to register trackers for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Add an additional tracker for a user
   * Single Responsibility: HTTP call to add tracker
   */
  async addTracker(
    userId: string,
    url: string,
    userData?: { username: string; globalName?: string; avatar?: string },
    channelId?: string,
    interactionToken?: string,
  ): Promise<any> {
    try {
      const response = await this.client.post('/internal/trackers/add', {
        userId,
        url,
        userData,
        channelId,
        interactionToken,
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Failed to add tracker for user ${userId}:`, error);
      throw error;
    }
  }
}

