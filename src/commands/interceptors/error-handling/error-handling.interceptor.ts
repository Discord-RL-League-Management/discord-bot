import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

/**
 * ErrorHandlingInterceptor - Catches and handles errors from command execution
 * Logs errors and sends user-friendly error messages to Discord
 */
@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorHandlingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const interaction = this.getInteraction(context);

    return next.handle().pipe(
      catchError((error: unknown) => {
        this.logger.error('Command execution error:', error);

        if (interaction && !interaction.replied && !interaction.deferred) {
          const errorMessage = this.getErrorMessage(error);
          const embed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription(errorMessage)
            .setColor(0xff0000)
            .setTimestamp();

          interaction
            .reply({ embeds: [embed], ephemeral: true })
            .catch((replyError) => {
              this.logger.error(
                'Failed to send error message to user:',
                replyError,
              );
            });
        } else if (
          interaction &&
          (interaction.replied || interaction.deferred)
        ) {
          const errorMessage = this.getErrorMessage(error);
          const embed = new EmbedBuilder()
            .setTitle('❌ Error')
            .setDescription(errorMessage)
            .setColor(0xff0000)
            .setTimestamp();

          interaction
            .followUp({ embeds: [embed], ephemeral: true })
            .catch((followUpError) => {
              this.logger.error(
                'Failed to send error follow-up to user:',
                followUpError,
              );
            });
        }

        // Re-throw error so it can be handled by other error handlers if needed
        return throwError(() => error);
      }),
    );
  }

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

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Check if it's an API error with a user-friendly message
      if ('response' in error && typeof error.response === 'object') {
        const response = error.response as { data?: { message?: string } };
        if (response.data?.message) {
          return response.data.message;
        }
      }

      // Use error message if available
      if (error.message) {
        // Don't expose internal error messages - use generic message
        // but log the actual error
        return 'An error occurred while processing your request. Please try again later.';
      }
    }

    return 'An unexpected error occurred. Please try again later.';
  }
}
