import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ChatInputCommandInteraction } from 'discord.js';
import { CommandLoggerService } from './command-logger.service';

/**
 * CommandLoggerInterceptor - Logs command execution start and successful completion
 * Uses CommandLoggerService to centralize logging logic
 */
@Injectable()
export class CommandLoggerInterceptor implements NestInterceptor {
  constructor(private readonly commandLogger: CommandLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const interaction = this.getInteraction(context);
    if (!interaction) {
      // Not a Discord interaction, skip logging
      return next.handle();
    }

    const startTime = Date.now();
    this.commandLogger.logCommandStart(interaction);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.commandLogger.logCommandSuccess(interaction, duration);
        },
        // Don't log errors here - ErrorHandlingInterceptor handles that
        // This ensures we don't interfere with error handling
      }),
    );
  }

  /**
   * Extract ChatInputCommandInteraction from ExecutionContext
   * Similar to CooldownInterceptor.getInteraction()
   */
  private getInteraction(
    context: ExecutionContext,
  ): ChatInputCommandInteraction | null {
    const args = context.getArgs();
    if (args && args.length > 0) {
      const firstArg = args[0] as unknown;
      if (
        firstArg &&
        typeof firstArg === 'object' &&
        'commandName' in firstArg &&
        'user' in firstArg
      ) {
        return firstArg as ChatInputCommandInteraction;
      }
    }
    return null;
  }
}
