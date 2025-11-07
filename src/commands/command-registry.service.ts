import { injectable } from 'inversify';
import { Collection } from 'discord.js';
import { ICommand } from './command.interface';
import { logger } from '../utils/logger';

/**
 * CommandRegistryService - Single Responsibility: Manage command collection
 * 
 * Central registry for all bot commands.
 * Provides command lookup and registration.
 */
@injectable()
export class CommandRegistryService {
  private commands: Collection<string, ICommand> = new Collection();

  register(command: ICommand): void {
    this.commands.set(command.data.name, command);
    logger.info(`Registered command: ${command.data.name}`);
  }

  get(commandName: string): ICommand | undefined {
    return this.commands.get(commandName);
  }

  getAll(): ICommand[] {
    return Array.from(this.commands.values());
  }

  getAllData() {
    return this.commands.map(command => command.data.toJSON());
  }
}












