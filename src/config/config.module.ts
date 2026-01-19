import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configSchema } from './config.schema';
import { ConfigService } from './config.service';

// Throws descriptive error if validation fails to prevent startup with invalid configuration
export function validate(config: Record<string, unknown>) {
  const result = configSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Invalid environment configuration:\n${errors.join('\n')}`);
  }

  return result.data;
}

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate,
      // Load environment-specific .env files with fallback
      // Priority: .env.{NODE_ENV}.local > .env.{NODE_ENV} > .env.local > .env
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}.local`,
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env.local',
        '.env',
      ],
      // In production, ignore .env files entirely - use system environment variables only
      // This follows NestJS best practices for cloud deployments (Railway, Docker, etc.)
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
