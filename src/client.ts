import axios, { AxiosInstance, AxiosError } from 'axios';

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
  details?: Record<string, any>;
}

export interface User {
  id: string;
  username: string;
  discriminator?: string;
  globalName?: string;
  avatar?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export interface CreateUserDto {
  id: string;
  username: string;
  discriminator?: string;
  globalName?: string;
  avatar?: string;
  email?: string;
}

export interface UpdateUserDto {
  username?: string;
  discriminator?: string;
  globalName?: string;
  avatar?: string;
  email?: string;
}

export interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
}

export interface CreateGuildDto {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  memberCount: number;
}

export interface CreateGuildMemberDto {
  userId: string;
  guildId: string;
  username: string;
  roles: string[];
}

/**
 * APIClient - Single responsibility: HTTP communication with league-api
 * No business logic, pure HTTP client
 */
export class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.API_BASE_URL,
      timeout: 10000, // 10 second timeout
      headers: {
        'Authorization': `Bearer ${process.env.API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: any) => response,
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
      console.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User> {
    try {
      const response = await this.client.get(`/internal/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to get user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    try {
      const response = await this.client.post('/internal/users', userData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, userData: UpdateUserDto): Promise<User> {
    try {
      const response = await this.client.patch(`/internal/users/${userId}`, userData);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to update user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await this.client.get('/internal/users');
      return response.data;
    } catch (error: any) {
      console.error('Failed to get all users:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.client.delete(`/internal/users/${userId}`);
    } catch (error: any) {
      console.error(`Failed to delete user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create guild in database
   * Single Responsibility: Guild creation API call
   */
  async createGuild(guildData: CreateGuildDto): Promise<any> {
    try {
      const response = await this.client.post('/internal/guilds', guildData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create guild:', error);
      throw error;
    }
  }

  /**
   * Remove guild from database (soft delete)
   * Single Responsibility: Guild removal API call
   */
  async removeGuild(guildId: string): Promise<any> {
    try {
      const response = await this.client.delete(`/internal/guilds/${guildId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to remove guild ${guildId}:`, error);
      throw error;
    }
  }

  /**
   * Create guild member
   * Single Responsibility: Member creation API call
   */
  async createGuildMember(memberData: CreateGuildMemberDto): Promise<any> {
    try {
      const response = await this.client.post(`/internal/guilds/${memberData.guildId}/members`, memberData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create guild member:', error);
      throw error;
    }
  }

  /**
   * Update guild member
   * Single Responsibility: Member update API call
   */
  async updateGuildMember(userId: string, guildId: string, memberData: {
    username?: string;
    roles?: string[];
  }): Promise<any> {
    try {
      const response = await this.client.patch(
        `/internal/guilds/${guildId}/members/${userId}`,
        memberData
      );
      return response.data;
    } catch (error: any) {
      console.error(`Failed to update guild member ${userId}:`, error);
      throw error;
    }
  }
}
