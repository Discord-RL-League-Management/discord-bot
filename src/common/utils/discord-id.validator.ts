import { ApiError } from '../../api/api-error.interface';

/**
 * Validates a Discord ID format (numeric string, 17-19 digits)
 * @param id - The Discord ID to validate
 * @throws {ApiError} If the ID format is invalid
 */
export function validateDiscordId(id: string): void {
  if (!/^\d{17,19}$/.test(id)) {
    throw new ApiError(
      `Invalid Discord ID format: ${id}. Discord IDs must be numeric strings of 17-19 digits.`,
      400,
      'INVALID_DISCORD_ID',
    );
  }
}
