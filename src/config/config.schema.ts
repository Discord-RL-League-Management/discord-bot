import { z } from 'zod';

export const configSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  API_BASE_URL: z.string().url('API_BASE_URL must be a valid URL'),
  API_KEY: z.string().min(1, 'API_KEY is required'),
  DASHBOARD_URL: z
    .union([z.string().url('DASHBOARD_URL must be a valid URL'), z.literal('')])
    .optional(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export type ConfigSchema = z.infer<typeof configSchema>;
