import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

/**
 * AppLogger - Custom logger extending ConsoleLogger
 * Properly decorated with @Injectable for DI and future Prometheus integration
 */
@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends ConsoleLogger {
  // Inherits all methods from ConsoleLogger including setContext
  // Can be extended later for Prometheus metrics, custom formatting, etc.
}
