import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiModule } from '../api/api.module';
import { ConfigModule } from '../config/config.module';
import { ConfigCommand } from './config.command';
import { HelpCommand } from './help.command';
import { RegisterCommand } from './register.command';
import { AddTrackerCommand } from './add-tracker.command';
import { ProcessTrackersCommand } from './process-trackers.command';
import { CooldownInterceptor } from './interceptors/cooldown/cooldown.interceptor';
import { ErrorHandlingInterceptor } from './interceptors/error-handling/error-handling.interceptor';

@Module({
  imports: [ApiModule, ConfigModule],
  providers: [
    ConfigCommand,
    HelpCommand,
    RegisterCommand,
    AddTrackerCommand,
    ProcessTrackersCommand,
    // Apply interceptors globally - they check for Discord interactions and skip if not found
    // Note: Interceptors registered via APP_INTERCEPTOR don't need to be in providers array
    // unless they need to be injected elsewhere. NestJS will instantiate them automatically.
    {
      provide: APP_INTERCEPTOR,
      useClass: CooldownInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorHandlingInterceptor,
    },
  ],
})
export class CommandsModule {}
