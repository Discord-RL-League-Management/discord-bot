import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { PermissionValidatorService } from '../permission-validator/permission-validator.service';
import { PermissionLoggerService } from '../permission-logger/permission-logger.service';
import { PermissionMetadata } from '../permission-metadata.interface';
import { AppLogger } from '../../common/app-logger.service';

/**
 * PermissionGuard - Guard that validates permissions before command execution
 * Throws ForbiddenException if permission is denied
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  // Command metadata mapping - maps command names to permission requirements
  private readonly commandMetadata: Map<string, PermissionMetadata> = new Map([
    // Add more commands as needed
  ]);

  constructor(
    private readonly logger: AppLogger,
    private readonly permissionValidator: PermissionValidatorService,
    private readonly permissionLogger: PermissionLoggerService,
  ) {
    this.logger.setContext(PermissionGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const interaction = this.getInteraction(context);
    if (!interaction) {
      // Not a Discord interaction, allow access
      return true;
    }

    const commandName = interaction.commandName;
    const metadata = this.getMetadata(commandName);

    try {
      const result = await this.permissionValidator.validateCommandPermissions(
        interaction,
        metadata,
      );

      this.permissionLogger.logCommandExecution(interaction, result, metadata);

      if (!result.allowed) {
        this.permissionLogger.logPermissionDenial(
          interaction,
          result.reason || 'Access denied',
        );
        await this.sendDenialMessage(interaction, result.reason);
        throw new ForbiddenException(result.reason || 'Permission denied');
      }

      this.permissionLogger.logPermissionGrant(interaction, metadata);
      return true;
    } catch (error: unknown) {
      // If it's already a ForbiddenException, re-throw it
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // Log unexpected errors and deny access
      this.logger.error('Error in permission guard:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.sendDenialMessage(
        interaction,
        'An error occurred while checking permissions. Please try again later.',
      );
      throw new ForbiddenException(`Permission check failed: ${errorMessage}`);
    }
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

  /**
   * Get permission metadata for a command
   * Can be extended to use Reflector if Necord supports SetMetadata decorator
   */
  private getMetadata(commandName: string): PermissionMetadata | undefined {
    return this.commandMetadata.get(commandName);
  }

  /**
   * Send denial message to Discord interaction
   * Single Responsibility: Send error message to user
   */
  private async sendDenialMessage(
    interaction: ChatInputCommandInteraction,
    reason?: string,
  ): Promise<void> {
    try {
      const message =
        reason || '❌ You do not have permission to use this command.';

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: message,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: message,
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send denial message to user ${interaction.user.id}:`,
        errorMessage,
      );
      // Don't throw - we've already thrown ForbiddenException
    }
  }
}
