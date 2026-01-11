import { validateDiscordId } from './discord-id.validator';
import { ApiError } from '../../api/api-error.interface';

// Helper function to extract error from sync function without try-catch in test
const getThrownError = <T extends Error>(fn: () => void): T | null => {
  try {
    fn();
    return null;
  } catch (error) {
    return error as T;
  }
};

describe('validateDiscordId', () => {
  describe('valid Discord IDs', () => {
    it('should accept valid 17-digit Discord ID', () => {
      const validId = '12345678901234567';

      expect(() => validateDiscordId(validId)).not.toThrow();
    });

    it('should accept valid 18-digit Discord ID', () => {
      const validId = '123456789012345678';

      expect(() => validateDiscordId(validId)).not.toThrow();
    });

    it('should accept valid 19-digit Discord ID', () => {
      const validId = '1234567890123456789';

      expect(() => validateDiscordId(validId)).not.toThrow();
    });

    it('should accept minimum valid Discord ID (17 digits)', () => {
      const validId = '10000000000000000';

      expect(() => validateDiscordId(validId)).not.toThrow();
    });

    it('should accept maximum valid Discord ID (19 digits)', () => {
      const validId = '9999999999999999999';

      expect(() => validateDiscordId(validId)).not.toThrow();
    });

    it('should accept Discord ID with leading zeros', () => {
      const validId = '00000000000000001';

      expect(() => validateDiscordId(validId)).not.toThrow();
    });

    it('should accept typical Discord snowflake IDs', () => {
      const validIds = [
        '123456789012345678', // Common 18-digit ID
        '987654321098765432', // Another common format
        '111111111111111111', // All ones
      ];

      validIds.forEach((id) => {
        expect(() => validateDiscordId(id)).not.toThrow();
      });
    });
  });

  describe('invalid Discord IDs', () => {
    it('should throw ApiError when ID is too short (< 17 digits)', () => {
      const invalidId = '1234567890123456'; // 16 digits

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
      expect(() => validateDiscordId(invalidId)).toThrow(
        'Invalid Discord ID format: 1234567890123456. Discord IDs must be numeric strings of 17-19 digits.',
      );
    });

    it('should throw ApiError when ID is too long (> 19 digits)', () => {
      const invalidId = '12345678901234567890'; // 20 digits

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
      expect(() => validateDiscordId(invalidId)).toThrow(
        'Invalid Discord ID format: 12345678901234567890. Discord IDs must be numeric strings of 17-19 digits.',
      );
    });

    it('should throw ApiError when ID contains non-numeric characters', () => {
      const invalidId = '12345678901234567a'; // Contains letter

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
      expect(() => validateDiscordId(invalidId)).toThrow(
        'Invalid Discord ID format: 12345678901234567a. Discord IDs must be numeric strings of 17-19 digits.',
      );
    });

    it('should throw ApiError when ID contains special characters', () => {
      const invalidId = '123456789012345-67'; // Contains dash

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
      expect(() => validateDiscordId(invalidId)).toThrow(
        'Invalid Discord ID format: 123456789012345-67. Discord IDs must be numeric strings of 17-19 digits.',
      );
    });

    it('should throw ApiError when ID contains spaces', () => {
      const invalidId = '123456789012345 67'; // Contains space

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
    });

    it('should throw ApiError when ID is empty string', () => {
      const invalidId = '';

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
      expect(() => validateDiscordId(invalidId)).toThrow(
        'Invalid Discord ID format: . Discord IDs must be numeric strings of 17-19 digits.',
      );
    });

    it('should throw ApiError when ID contains decimal point', () => {
      const invalidId = '123456789012345.67';

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
    });

    it('should throw ApiError with correct error instance type', () => {
      const invalidId = 'invalid';

      const apiError = getThrownError<ApiError>(() =>
        validateDiscordId(invalidId),
      );
      expect(apiError).not.toBeNull();
      expect(apiError!).toBeInstanceOf(ApiError);
    });

    it('should throw ApiError with correct status code and error code', () => {
      const invalidId = 'invalid';

      const apiError = getThrownError<ApiError>(() =>
        validateDiscordId(invalidId),
      );
      expect(apiError).not.toBeNull();
      expect(apiError!.statusCode).toBe(400);
      expect(apiError!.code).toBe('INVALID_DISCORD_ID');
    });

    it('should throw ApiError with correct error message content', () => {
      const invalidId = 'invalid';

      const apiError = getThrownError<ApiError>(() =>
        validateDiscordId(invalidId),
      );
      expect(apiError).not.toBeNull();
      expect(apiError!.message).toContain('Invalid Discord ID format');
      expect(apiError!.message).toContain('invalid');
      expect(apiError!.message).toContain(
        'Discord IDs must be numeric strings of 17-19 digits',
      );
    });

    it('should throw ApiError with status code 400', () => {
      const invalidId = 'too-short';

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
      const apiError = getThrownError<ApiError>(() =>
        validateDiscordId(invalidId),
      );
      expect(apiError).not.toBeNull();
      expect(apiError!).toBeInstanceOf(ApiError);
      expect(apiError!.statusCode).toBe(400);
    });

    it('should throw ApiError with code INVALID_DISCORD_ID', () => {
      const invalidId = 'not-a-number';

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
      const apiError = getThrownError<ApiError>(() =>
        validateDiscordId(invalidId),
      );
      expect(apiError).not.toBeNull();
      expect(apiError!).toBeInstanceOf(ApiError);
      expect(apiError!.code).toBe('INVALID_DISCORD_ID');
    });

    it('should include the invalid ID in the error message', () => {
      const invalidId = '12345';

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
      const apiError = getThrownError<ApiError>(() =>
        validateDiscordId(invalidId),
      );
      expect(apiError).not.toBeNull();
      expect(apiError!).toBeInstanceOf(ApiError);
      expect(apiError!.message).toContain(invalidId);
    });

    it('should throw ApiError for single digit ID', () => {
      const invalidId = '1';

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
    });

    it('should throw ApiError for very short numeric string', () => {
      const invalidId = '123';

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
    });

    it('should throw ApiError when ID contains leading/trailing whitespace (implicitly tested by regex)', () => {
      const invalidId = ' 12345678901234567'; // Leading space (will fail regex)

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
    });

    it('should throw ApiError for UUID format (contains hyphens)', () => {
      const invalidId = '12345678-1234-1234-1234-123456789012';

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
    });

    it('should throw ApiError for hex format (contains letters)', () => {
      const invalidId = '1234567890123456a';

      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
    });
  });

  describe('edge cases', () => {
    it('should handle exactly 17-digit boundary', () => {
      const validId = '12345678901234567'; // Exactly 17 digits
      const invalidId = '1234567890123456'; // Exactly 16 digits

      expect(() => validateDiscordId(validId)).not.toThrow();
      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
    });

    it('should handle exactly 19-digit boundary', () => {
      const validId = '1234567890123456789'; // Exactly 19 digits
      const invalidId = '12345678901234567890'; // Exactly 20 digits

      expect(() => validateDiscordId(validId)).not.toThrow();
      expect(() => validateDiscordId(invalidId)).toThrow(ApiError);
    });

    it('should handle string with only zeros', () => {
      const validId = '00000000000000000'; // 17 zeros

      expect(() => validateDiscordId(validId)).not.toThrow();
    });

    it('should handle very large numeric values (within range)', () => {
      const validId = '9223372036854775807'; // Max 64-bit signed int (19 digits)

      expect(() => validateDiscordId(validId)).not.toThrow();
    });
  });
});
