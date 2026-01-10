import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiHealthService } from './api-health.service';

/**
 * ApiHealthGuard - Guard that checks API availability before allowing requests
 * Throws ServiceUnavailableException if API is unavailable
 */
@Injectable()
export class ApiHealthGuard implements CanActivate {
  private readonly logger = new Logger(ApiHealthGuard.name);

  constructor(private readonly apiHealthService: ApiHealthService) {}

  async canActivate(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: ExecutionContext,
  ): Promise<boolean> {
    try {
      await this.apiHealthService.checkHealth();
      return true;
    } catch (error: unknown) {
      this.logger.error('API health check failed in guard:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'API unavailable';
      throw new ServiceUnavailableException(
        `API is currently unavailable: ${errorMessage}. Request cannot be processed.`,
      );
    }
  }
}
