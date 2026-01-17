import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ApiModule } from '../api/api.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PermissionGuard } from '../permissions/permission/permission.guard';
import { HelpCommand } from './help.command';
import { CooldownInterceptor } from './interceptors/cooldown/cooldown.interceptor';
import { CommandLoggerInterceptor } from './interceptors/command-logger/command-logger.interceptor';
import { CommandLoggerService } from './interceptors/command-logger/command-logger.service';
import { ErrorHandlingInterceptor } from './interceptors/error-handling/error-handling.interceptor';

@Module({
  imports: [ApiModule, PermissionsModule],
  providers: [
    HelpCommand,
    CommandLoggerService,
    // Add interceptors explicitly to providers so TypeScript can properly infer dependency types
    CooldownInterceptor,
    CommandLoggerInterceptor,
    ErrorHandlingInterceptor,
    // Apply guard globally - checks permissions before interceptors
    // Guards execute before interceptors in NestJS
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    // Apply interceptors globally - they check for Discord interactions and skip if not found
    // Execution order: CooldownInterceptor → CommandLoggerInterceptor → ErrorHandlingInterceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: CooldownInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CommandLoggerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorHandlingInterceptor,
    },
  ],
})
export class CommandsModule {}
