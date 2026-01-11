import { z } from 'zod';

export const configSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  // API address can be configured either via full URL (API_BASE_URL) or components (API_HOST, API_PORT, API_PROTOCOL)
  API_BASE_URL: z.string().url('API_BASE_URL must be a valid URL').optional(),
  API_HOST: z.string().optional(),
  API_PORT: z.string().optional(),
  API_PROTOCOL: z.enum(['http', 'https']).optional(),
  BOT_API_KEY: z.string().min(1, 'BOT_API_KEY is required'),
  BOT_PORT: z
    .string()
    .regex(/^\d+$/, 'BOT_PORT must be a valid port number')
    .optional(),
  DASHBOARD_URL: z
    .union([z.string().url('DASHBOARD_URL must be a valid URL'), z.literal('')])
    .optional(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export type ConfigSchema = z.infer<typeof configSchema>;
