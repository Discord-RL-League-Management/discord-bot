import { z } from 'zod';

/**
 * Environment configuration schema
 * Validates all required environment variables at startup
 */
const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  API_BASE_URL: z.string().url('API_BASE_URL must be a valid URL'),
  API_KEY: z.string().min(1, 'API_KEY is required'),
});

export type EnvironmentConfig = z.infer<typeof envSchema>;

/**
 * Validate and return environment configuration
 * Throws error on startup if validation fails (fail fast)
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
    throw new Error(`❌ Invalid environment configuration:\n${errors.join('\n')}`);
  }

  return result.data;
}

