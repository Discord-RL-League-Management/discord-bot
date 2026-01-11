import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ApiHealthService } from './api/api-health.service';
import { ConfigService } from './config/config.service';
import { Logger } from '@nestjs/common';

export async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Fail fast if API is unavailable
  try {
    const apiHealthService = app.get(ApiHealthService);
    await apiHealthService.checkHealth();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'API health check failed';
    logger.error(`Failed to start bot: ${errorMessage}`);
    logger.error(
      'Bot cannot start without API connection. Please ensure the API is running and accessible.',
    );
    // Ensure app is closed even if close() throws
    try {
      await app.close();
    } catch (closeError: unknown) {
      logger.error('Error closing application:', closeError);
    }
    process.exit(1);
    return; // Prevent further execution in tests where process.exit is mocked
  }

  const configService = app.get(ConfigService);
  const port = configService.getBotPort();
  await app.listen(port);
  logger.log(`Bot server listening on port ${port}`);
}

// Only call bootstrap if this file is being executed directly (not imported)
if (require.main === module) {
  void bootstrap();
}
