import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configSchema } from './config.schema';
import { ConfigService } from './config.service';

// Throws descriptive error if validation fails to prevent startup with invalid configuration
function validate(config: Record<string, unknown>) {
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
      envFilePath: ['.env'],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
