import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ConfigService } from '../config/config.service';
import { ApiError } from './api-error.interface';
import { HealthCheckResponse } from './health-check-response.interface';
import { CreateGuildDto } from './dto/create-guild.dto';
import { validateDiscordId } from '../common/utils/discord-id.validator';

/**
 * ApiService - Single Responsibility: HTTP communication with league-api only
 *
 * Returns raw API responses (no business logic).
 * Uses HttpService with error transformation.
 */
@Injectable()
export class ApiService {
  private readonly logger = new Logger(ApiService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Type guard to check if error is an AxiosError
   */
  private isAxiosError(err: unknown): err is AxiosError<{
    message?: string;
    error?: string;
    code?: string;
    details?: unknown;
  }> {
    return (
      err instanceof AxiosError ||
      (typeof err === 'object' &&
        err !== null &&
        ('response' in err || 'request' in err))
    );
  }

  /**
   * Type guard to check if error has a message property
   */
  private hasMessage(err: unknown): err is { message: string } {
    return (
      typeof err === 'object' &&
      err !== null &&
      'message' in err &&
      typeof (err as { message: unknown }).message === 'string'
    );
  }

  /**
   * Extracts error message, code, and details from an AxiosError
   */
  private extractAxiosErrorMessage(
    error: AxiosError<{
      message?: string;
      error?: string;
      code?: string;
      details?: unknown;
    }>,
  ): {
    message: string;
    code?: string;
    details?: unknown;
  } {
    let message = 'API request failed';
    let code: string | undefined;
    let details: unknown;

    if (error.response?.data) {
      const errorData = error.response.data;
      if (typeof errorData === 'object' && errorData !== null) {
        const data = errorData as {
          message?: string;
          error?: string;
          code?: string;
          details?: unknown;
        };
        message =
          data.message ||
          data.error ||
          (this.hasMessage(error) ? error.message : 'API request failed');
        code = typeof data.code === 'string' ? data.code : undefined;
        details = data.details;
      } else {
        message = this.hasMessage(error) ? error.message : 'API request failed';
      }
    } else if (this.hasMessage(error)) {
      message = error.message;
    }

    return { message, code, details };
  }

  /**
   * Transforms unknown errors into appropriate Error types
   * Always throws - never returns
   */
  private transformError(error: unknown): never {
    if (this.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const { message, code, details } = this.extractAxiosErrorMessage(error);
      throw new ApiError(message, statusCode, code, details);
    }

    if (error instanceof Error) {
      throw error;
    }

    const errorMessage =
      typeof error === 'string'
        ? error
        : this.hasMessage(error)
          ? error.message
          : 'Unknown error occurred';
    throw new Error(errorMessage);
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<HealthCheckResponse>('/internal/health'),
      );
      if (!response.data) {
        throw new ApiError('API returned no data', response.status, 'NO_DATA');
      }
      return response.data;
    } catch (error: unknown) {
      this.logger.error('Health check failed:', error);
      this.transformError(error);
    }
  }

  /**
   * Create guild in database
   */
  async createGuild(guildData: CreateGuildDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/internal/guilds', guildData),
      );
      if (!response.data) {
        throw new ApiError('API returned no data', response.status, 'NO_DATA');
      }
      return response.data;
    } catch (error: unknown) {
      this.logger.error('Failed to create guild:', error);
      this.transformError(error);
    }
  }

  /**
   * Upsert guild in database (create or update)
   * Single Responsibility: HTTP call to upsert guild
   */
  async upsertGuild(guildData: CreateGuildDto): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/internal/guilds/upsert', guildData),
      );
      if (!response.data) {
        throw new ApiError('API returned no data', response.status, 'NO_DATA');
      }
      return response.data;
    } catch (error: unknown) {
      const errorObj = error as Record<string, unknown>;
      const responseObj =
        typeof errorObj.response === 'object' && errorObj.response !== null
          ? (errorObj.response as Record<string, unknown>)
          : null;
      this.logger.error('Failed to upsert guild:', {
        message:
          (typeof errorObj.message === 'string' ? errorObj.message : null) ||
          'Unknown error',
        statusCode:
          (typeof errorObj.statusCode === 'number'
            ? errorObj.statusCode
            : null) ||
          (responseObj && typeof responseObj.status === 'number'
            ? responseObj.status
            : undefined),
        code: typeof errorObj.code === 'string' ? errorObj.code : undefined,
        details: errorObj.details,
        response: responseObj?.data,
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
      this.transformError(error);
    }
  }

  /**
   * Remove guild from database (soft delete)
   */
  async removeGuild(guildId: string): Promise<any> {
    validateDiscordId(guildId);
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`/internal/guilds/${guildId}`),
      );
      if (!response.data) {
        throw new ApiError('API returned no data', response.status, 'NO_DATA');
      }
      return response.data;
    } catch (error: unknown) {
      this.logger.error(`Failed to remove guild ${guildId}:`, error);
      this.transformError(error);
    }
  }

  /**
   * Create guild member in database
   * Single Responsibility: HTTP call to create member
   */
  async createGuildMember(
    guildId: string,
    memberData: {
      userId: string;
      username: string;
      nickname?: string;
      roles: string[];
    },
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/internal/guild-members', {
          ...memberData,
          guildId,
        }),
      );
      if (!response.data) {
        throw new ApiError('API returned no data', response.status, 'NO_DATA');
      }
      return response.data;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to create guild member ${memberData.userId}:`,
        error,
      );
      this.transformError(error);
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
    members: Array<{
      userId: string;
      username: string;
      nickname?: string;
      roles: string[];
    }>,
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
    members: Array<{
      userId: string;
      username: string;
      nickname?: string;
      roles: string[];
    }>,
    rolesData?: { admin: Array<{ id: string; name: string }> },
  ): Promise<any> {
    validateDiscordId(guildId);
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/internal/guilds/${guildId}/sync`, {
          guild: guildData,
          members,
          roles: rolesData,
        }),
      );
      if (!response.data) {
        throw new ApiError('API returned no data', response.status, 'NO_DATA');
      }
      return response.data;
    } catch (error: unknown) {
      const errorObj = error as Record<string, unknown>;
      const responseObj =
        typeof errorObj.response === 'object' && errorObj.response !== null
          ? (errorObj.response as Record<string, unknown>)
          : null;
      this.logger.error(
        `Failed to sync guild with members and roles for guild ${guildId}:`,
        {
          message:
            (typeof errorObj.message === 'string' ? errorObj.message : null) ||
            'Unknown error',
          statusCode:
            (typeof errorObj.statusCode === 'number'
              ? errorObj.statusCode
              : null) ||
            (responseObj && typeof responseObj.status === 'number'
              ? responseObj.status
              : undefined),
          code: typeof errorObj.code === 'string' ? errorObj.code : undefined,
          details: errorObj.details,
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
        },
      );
      this.transformError(error);
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
    members: Array<{
      userId: string;
      username: string;
      nickname?: string;
      roles: string[];
    }>,
  ): Promise<any> {
    validateDiscordId(guildId);
    try {
      const response = await firstValueFrom(
        this.httpService.post(`/internal/guild-members/${guildId}/sync`, {
          members,
        }),
      );
      if (!response.data) {
        throw new ApiError('API returned no data', response.status, 'NO_DATA');
      }
      return response.data;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to sync guild members for guild ${guildId}:`,
        error,
      );
      this.transformError(error);
    }
  }

  /**
   * Update guild member in database
   * Single Responsibility: HTTP call to update member
   */
  async updateGuildMember(
    guildId: string,
    userId: string,
    updateData: Partial<{
      username: string;
      nickname?: string;
      roles: string[];
    }>,
  ): Promise<any> {
    validateDiscordId(guildId);
    validateDiscordId(userId);
    try {
      const response = await firstValueFrom(
        this.httpService.patch(
          `/internal/guild-members/${guildId}/users/${userId}`,
          updateData,
        ),
      );
      if (!response.data) {
        throw new ApiError('API returned no data', response.status, 'NO_DATA');
      }
      return response.data;
    } catch (error: unknown) {
      this.logger.error(`Failed to update guild member ${userId}:`, error);
      this.transformError(error);
    }
  }

  /**
   * Remove guild member from database
   * Single Responsibility: HTTP call to remove member
   */
  async removeGuildMember(guildId: string, userId: string): Promise<any> {
    validateDiscordId(guildId);
    validateDiscordId(userId);
    try {
      const response = await firstValueFrom(
        this.httpService.delete(
          `/internal/guild-members/${guildId}/users/${userId}`,
        ),
      );
      if (!response.data) {
        throw new ApiError('API returned no data', response.status, 'NO_DATA');
      }
      return response.data;
    } catch (error: unknown) {
      this.logger.error(`Failed to remove guild member ${userId}:`, error);
      this.transformError(error);
    }
  }

  /**
   * Get guild settings from database
   * Single Responsibility: HTTP call to get settings
   */
  async getGuildSettings(guildId: string): Promise<any> {
    validateDiscordId(guildId);
    try {
      const response = await firstValueFrom(
        this.httpService.get(`/internal/guilds/${guildId}/settings`),
      );
      if (!response.data) {
        throw new ApiError('API returned no data', response.status, 'NO_DATA');
      }
      return response.data;
    } catch (error: unknown) {
      this.logger.error(`Failed to get guild settings ${guildId}:`, error);
      this.transformError(error);
    }
  }

  /**
   * Register multiple trackers for a user (1-4 trackers)
   * Single Responsibility: HTTP call to register multiple trackers
   */
  async registerTrackers(
    userId: string,
    urls: string[],
    userData?: {
      username: string;
      globalName?: string;
      avatar?: string;
    },
    channelId?: string,
    interactionToken?: string,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/internal/trackers/register-multiple', {
          userId,
          urls,
          userData,
          channelId,
          interactionToken,
        }),
      );
      if (!response.data) {
        throw new ApiError('API returned no data', response.status, 'NO_DATA');
      }
      return response.data;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to register trackers for user ${userId}:`,
        error,
      );
      this.transformError(error);
    }
  }

  /**
   * Add an additional tracker for a user
   * Single Responsibility: HTTP call to add tracker
   */
  async addTracker(
    userId: string,
    url: string,
    userData?: {
      username: string;
      globalName?: string;
      avatar?: string;
    },
    channelId?: string,
    interactionToken?: string,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/internal/trackers/add', {
          userId,
          url,
          userData,
          channelId,
          interactionToken,
        }),
      );
      if (!response.data) {
        throw new ApiError('API returned no data', response.status, 'NO_DATA');
      }
      return response.data;
    } catch (error: unknown) {
      this.logger.error(`Failed to add tracker for user ${userId}:`, error);
      this.transformError(error);
    }
  }

  /**
   * Process trackers for a guild - triggers API to scrape/process tracker data
   * Single Responsibility: HTTP call to process trackers for a guild
   */
  async processTrackers(guildId: string): Promise<{
    processed: number;
    trackers: string[];
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/internal/trackers/process', {
          guildId,
        }),
      );
      if (!response.data) {
        throw new ApiError('API returned no data', response.status, 'NO_DATA');
      }
      return response.data as { processed: number; trackers: string[] };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to process trackers for guild ${guildId}:`,
        error,
      );
      this.transformError(error);
    }
  }
}
