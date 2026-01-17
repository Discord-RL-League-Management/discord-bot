import { Injectable } from '@nestjs/common';
import { ApiService } from './api.service';
import { AppLogger } from '../common/app-logger.service';

/**
 * ApiHealthService - Service for checking API health status
 * Used for startup health checks to ensure API is available before bot starts
 */
@Injectable()
export class ApiHealthService {
  constructor(
    private readonly apiService: ApiService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ApiHealthService.name);
  }

  /**
   * Check API health with timeout handling
   * Throws error if API is unavailable or health check times out
   * Timeout is handled by axios configuration in HttpModule (10s timeout)
   * which properly cancels the underlying HTTP request on timeout
   */
  async checkHealth(): Promise<void> {
    try {
      this.logger.log('Checking API health...');
      await this.apiService.healthCheck();
      this.logger.log('API health check passed');
    } catch (error: unknown) {
      this.logger.error('API health check failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'API unavailable';
      throw new Error(
        `API health check failed: ${errorMessage}. Bot cannot start without API connection.`,
      );
    }
  }
}
