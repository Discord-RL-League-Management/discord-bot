import { Global, Module, Logger } from '@nestjs/common';
import { AppLogger } from './app-logger.service';

@Global()
@Module({
  providers: [
    AppLogger,
    {
      provide: Logger,
      useClass: AppLogger,
    },
  ],
  exports: [Logger, AppLogger],
})
export class LoggerModule {}
