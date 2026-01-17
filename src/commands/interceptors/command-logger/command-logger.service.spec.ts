import { Test, TestingModule } from '@nestjs/testing';
import { CommandLoggerService } from './command-logger.service';
import { ChatInputCommandInteraction } from 'discord.js';
import { AppLogger } from '../../../common/app-logger.service';

describe('CommandLoggerService', () => {
  let service: CommandLoggerService;
  let module: TestingModule;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  const mockInteraction = {
    user: { id: '123456789012345678' },
    guildId: '987654321098765432',
    channelId: '111111111111111111',
    commandName: 'test-command',
  } as unknown as ChatInputCommandInteraction;

  const dmInteraction = {
    user: { id: '123456789012345678' },
    guildId: null,
    channelId: null,
    commandName: 'test-command',
  } as unknown as ChatInputCommandInteraction;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CommandLoggerService,
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<CommandLoggerService>(CommandLoggerService);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logCommandStart', () => {
    it('should log command start with guild interaction', () => {
      const logSpy = jest.spyOn(mockLogger, 'log');

      service.logCommandStart(mockInteraction);

      expect(logSpy).toHaveBeenCalledWith('Command started: test-command', {
        userId: '123456789012345678',
        guildId: '987654321098765432',
        channelId: '111111111111111111',
        commandName: 'test-command',
      });
    });

    it('should log command start with DM interaction', () => {
      const logSpy = jest.spyOn(mockLogger, 'log');

      service.logCommandStart(dmInteraction);

      expect(logSpy).toHaveBeenCalledWith('Command started: test-command', {
        userId: '123456789012345678',
        guildId: 'DM',
        channelId: 'unknown',
        commandName: 'test-command',
      });
    });
  });

  describe('logCommandSuccess', () => {
    it('should log command success with duration', () => {
      const logSpy = jest.spyOn(mockLogger, 'log');
      const duration = 150;

      service.logCommandSuccess(mockInteraction, duration);

      expect(logSpy).toHaveBeenCalledWith('Command completed: test-command', {
        userId: '123456789012345678',
        guildId: '987654321098765432',
        channelId: '111111111111111111',
        commandName: 'test-command',
        duration: '150ms',
      });
    });

    it('should log command success with DM interaction', () => {
      const logSpy = jest.spyOn(mockLogger, 'log');
      const duration = 200;

      service.logCommandSuccess(dmInteraction, duration);

      expect(logSpy).toHaveBeenCalledWith('Command completed: test-command', {
        userId: '123456789012345678',
        guildId: 'DM',
        channelId: 'unknown',
        commandName: 'test-command',
        duration: '200ms',
      });
    });
  });
});
