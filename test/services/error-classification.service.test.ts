import { ErrorClassificationService } from '../../src/services/error-classification.service';
import { ApiError } from '@league-management/shared-types';

describe('ErrorClassificationService', () => {
  let service: ErrorClassificationService;

  beforeEach(() => {
    service = new ErrorClassificationService();
  });

  describe('isConflictError', () => {
    it('should return true for error with statusCode 409', () => {
      // Arrange
      const error: ApiError = {
        message: 'Conflict',
        statusCode: 409,
      };

      // Act
      const result = service.isConflictError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for error with statusCode 404', () => {
      // Arrange
      const error: ApiError = {
        message: 'Not Found',
        statusCode: 404,
      };

      // Act
      const result = service.isConflictError(error);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for error with statusCode 500', () => {
      // Arrange
      const error: ApiError = {
        message: 'Server Error',
        statusCode: 500,
      };

      // Act
      const result = service.isConflictError(error);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for AxiosError format with status 409', () => {
      // Arrange
      const error = {
        response: {
          status: 409,
        },
      };

      // Act
      const result = service.isConflictError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for AxiosError format with status 400', () => {
      // Arrange
      const error = {
        response: {
          status: 400,
        },
      };

      // Act
      const result = service.isConflictError(error);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for error without response', () => {
      // Arrange
      const error = {
        message: 'Network error',
      };

      // Act
      const result = service.isConflictError(error);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isTransientError', () => {
    it('should return true for error with statusCode 500', () => {
      // Arrange
      const error: ApiError = {
        message: 'Server Error',
        statusCode: 500,
      };

      // Act
      const result = service.isTransientError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for error with statusCode 502', () => {
      // Arrange
      const error: ApiError = {
        message: 'Bad Gateway',
        statusCode: 502,
      };

      // Act
      const result = service.isTransientError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for error with statusCode 429', () => {
      // Arrange
      const error: ApiError = {
        message: 'Rate Limited',
        statusCode: 429,
      };

      // Act
      const result = service.isTransientError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for error with no statusCode (network error)', () => {
      // Arrange
      const error: ApiError = {
        message: 'Network error',
      };

      // Act
      const result = service.isTransientError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for error with statusCode 400', () => {
      // Arrange
      const error: ApiError = {
        message: 'Bad Request',
        statusCode: 400,
      };

      // Act
      const result = service.isTransientError(error);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for error with statusCode 409', () => {
      // Arrange
      const error: ApiError = {
        message: 'Conflict',
        statusCode: 409,
      };

      // Act
      const result = service.isTransientError(error);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for AxiosError format with status 500', () => {
      // Arrange
      const error = {
        response: {
          status: 500,
        },
      };

      // Act
      const result = service.isTransientError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for AxiosError format with status 429', () => {
      // Arrange
      const error = {
        response: {
          status: 429,
        },
      };

      // Act
      const result = service.isTransientError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for network error with ECONNABORTED code', () => {
      // Arrange
      const error = {
        code: 'ECONNABORTED',
        message: 'Request timeout',
      };

      // Act
      const result = service.isTransientError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for network error with ETIMEDOUT code', () => {
      // Arrange
      const error = {
        code: 'ETIMEDOUT',
        message: 'Connection timeout',
      };

      // Act
      const result = service.isTransientError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for network error with ECONNRESET code', () => {
      // Arrange
      const error = {
        code: 'ECONNRESET',
        message: 'Connection reset',
      };

      // Act
      const result = service.isTransientError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for error without response or code (network error)', () => {
      // Arrange
      const error = {
        message: 'Network error',
      };

      // Act
      const result = service.isTransientError(error);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('isPermanentError', () => {
    it('should return false for conflict error (409)', () => {
      // Arrange
      const error: ApiError = {
        message: 'Conflict',
        statusCode: 409,
      };

      // Act
      const result = service.isPermanentError(error);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for error with statusCode 400', () => {
      // Arrange
      const error: ApiError = {
        message: 'Bad Request',
        statusCode: 400,
      };

      // Act
      const result = service.isPermanentError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for error with statusCode 401', () => {
      // Arrange
      const error: ApiError = {
        message: 'Unauthorized',
        statusCode: 401,
      };

      // Act
      const result = service.isPermanentError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for error with statusCode 403', () => {
      // Arrange
      const error: ApiError = {
        message: 'Forbidden',
        statusCode: 403,
      };

      // Act
      const result = service.isPermanentError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for error with statusCode 429 (transient)', () => {
      // Arrange
      const error: ApiError = {
        message: 'Rate Limited',
        statusCode: 429,
      };

      // Act
      const result = service.isPermanentError(error);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for error with no statusCode (network error)', () => {
      // Arrange
      const error: ApiError = {
        message: 'Network error',
      };

      // Act
      const result = service.isPermanentError(error);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for error with statusCode 500 (transient)', () => {
      // Arrange
      const error: ApiError = {
        message: 'Server Error',
        statusCode: 500,
      };

      // Act
      const result = service.isPermanentError(error);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for AxiosError format with status 400', () => {
      // Arrange
      const error = {
        response: {
          status: 400,
        },
      };

      // Act
      const result = service.isPermanentError(error);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for AxiosError format with status 409', () => {
      // Arrange
      const error = {
        response: {
          status: 409,
        },
      };

      // Act
      const result = service.isPermanentError(error);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for AxiosError format with status 429', () => {
      // Arrange
      const error = {
        response: {
          status: 429,
        },
      };

      // Act
      const result = service.isPermanentError(error);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for AxiosError format with status 500', () => {
      // Arrange
      const error = {
        response: {
          status: 500,
        },
      };

      // Act
      const result = service.isPermanentError(error);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for error without response', () => {
      // Arrange
      const error = {
        message: 'Network error',
      };

      // Act
      const result = service.isPermanentError(error);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('error format handling', () => {
    it('should handle ApiError format correctly', () => {
      // Arrange
      const apiError: ApiError = {
        message: 'Test error',
        statusCode: 409,
        code: 'CONFLICT',
        details: { guildId: '123' },
      };

      // Act & Assert
      expect(service.isConflictError(apiError)).toBe(true);
      expect(service.isTransientError(apiError)).toBe(false);
      expect(service.isPermanentError(apiError)).toBe(false);
    });

    it('should handle AxiosError format correctly', () => {
      // Arrange
      const axiosError = {
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
        message: 'Request failed',
      };

      // Act & Assert
      expect(service.isConflictError(axiosError)).toBe(false);
      expect(service.isTransientError(axiosError)).toBe(true);
      expect(service.isPermanentError(axiosError)).toBe(false);
    });

    it('should handle generic Error gracefully', () => {
      // Arrange
      const genericError = new Error('Generic error');

      // Act & Assert
      expect(service.isConflictError(genericError)).toBe(false);
      expect(service.isTransientError(genericError)).toBe(true); // Network-like error
      expect(service.isPermanentError(genericError)).toBe(false);
    });
  });
});












