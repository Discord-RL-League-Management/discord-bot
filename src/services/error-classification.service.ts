import { injectable } from 'inversify';
import { ApiError } from '@league-management/shared-types';

/**
 * ErrorClassificationService - Single Responsibility: Classify API errors into categories
 * 
 * Provides methods to categorize errors for appropriate handling.
 * Extensible: Easy to add new error types and classification rules.
 */
@injectable()
export class ErrorClassificationService {
  /**
   * Check if error is a conflict error (409 status code)
   * Single Responsibility: Conflict error detection
   */
  isConflictError(error: any): boolean {
    if (this.isApiError(error)) {
      return error.statusCode === 409;
    }
    
    // Handle AxiosError format
    if (error.response?.status === 409) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if error is a transient error (retryable)
   * Single Responsibility: Transient error detection
   * 
   * Transient errors include:
   * - 5xx server errors
   * - Network errors (timeouts, connection failures)
   * - Rate limiting (429) - can be retried after delay
   */
  isTransientError(error: any): boolean {
    if (this.isApiError(error)) {
      const statusCode = error.statusCode;
      if (!statusCode) {
        // Network errors or timeouts have no status code
        return true;
      }
      // 5xx errors are transient
      if (statusCode >= 500 && statusCode < 600) {
        return true;
      }
      // 429 (rate limit) is transient (can retry after delay)
      if (statusCode === 429) {
        return true;
      }
      return false;
    }
    
    // Handle AxiosError format
    if (error.response) {
      const status = error.response.status;
      // 5xx errors are transient
      if (status >= 500 && status < 600) {
        return true;
      }
      // 429 (rate limit) is transient
      if (status === 429) {
        return true;
      }
    } else if (error.code) {
      // Network errors (timeouts, connection failures)
      const networkErrorCodes = ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED'];
      if (networkErrorCodes.includes(error.code)) {
        return true;
      }
    } else {
      // No response and no code likely means network error
      return true;
    }
    
    return false;
  }

  /**
   * Check if error is a permanent error (not retryable)
   * Single Responsibility: Permanent error detection
   * 
   * Permanent errors include:
   * - 4xx errors (except 409 which is handled separately, and 429 which is transient)
   * - Validation errors
   * - Authentication/authorization errors (401, 403)
   */
  isPermanentError(error: any): boolean {
    // Conflict errors are handled separately, not permanent in this context
    if (this.isConflictError(error)) {
      return false;
    }
    
    if (this.isApiError(error)) {
      const statusCode = error.statusCode;
      if (!statusCode) {
        return false; // Network errors are transient
      }
      // 4xx errors (except 409, 429) are permanent
      if (statusCode >= 400 && statusCode < 500 && statusCode !== 409 && statusCode !== 429) {
        return true;
      }
      return false;
    }
    
    // Handle AxiosError format
    if (error.response) {
      const status = error.response.status;
      // 4xx errors (except 409, 429) are permanent
      if (status >= 400 && status < 500 && status !== 409 && status !== 429) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if error is a database schema error (Prisma P2021)
   * Single Responsibility: Database schema error detection
   * 
   * P2021 indicates a table doesn't exist in the database.
   * This is a configuration issue that needs to be fixed on the API side.
   */
  isDatabaseSchemaError(error: any): boolean {
    if (this.isApiError(error)) {
      // Check for Prisma P2021 error code
      if (error.code === 'PRISMA_P2021' || error.code === 'P2021') {
        return true;
      }
      // Check in details
      if (error.details?.prismaCode === 'P2021') {
        return true;
      }
    }
    
    // Check error message for Prisma P2021 indicators
    if (error?.message?.includes('P2021') || 
        (error?.message?.includes('table') && error?.message?.includes('does not exist'))) {
      return true;
    }
    
    return false;
  }

  /**
   * Get a human-readable error message for database schema errors
   * Single Responsibility: Format database schema error messages
   */
  getDatabaseSchemaErrorMessage(error: any): string {
    if (!this.isDatabaseSchemaError(error)) {
      return error?.message || 'Unknown error';
    }

    const tableName = error.details?.meta?.table || error.details?.meta?.modelName || 'unknown table';
    return `Database schema error: The table '${tableName}' does not exist. This indicates the database migrations need to be run on the API server. Please contact the API administrator to run database migrations.`;
  }

  /**
   * Check if error matches ApiError type
   * Single Responsibility: Type guard for ApiError
   */
  private isApiError(error: any): error is ApiError {
    return (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      ('statusCode' in error || 'code' in error || 'details' in error)
    );
  }
}
