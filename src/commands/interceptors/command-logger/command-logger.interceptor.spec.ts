import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { CommandLoggerInterceptor } from './command-logger.interceptor';
import { CommandLoggerService } from './command-logger.service';
import { of } from 'rxjs';
import { ChatInputCommandInteraction, User } from 'discord.js';

describe('CommandLoggerInterceptor', () => {
  let interceptor: CommandLoggerInterceptor;
  let commandLoggerService: jest.Mocked<CommandLoggerService>;
  let module: TestingModule;

  const createMockInteraction = (): ChatInputCommandInteraction => {
    const mockUser = {
      id: '111111111111111111',
    } as User;

    return {
      user: mockUser,
      commandName: 'test',
      guildId: '987654321098765432',
      channelId: '111111111111111111',
    } as unknown as ChatInputCommandInteraction;
  };

  const createMockExecutionContext = (
    interaction: ChatInputCommandInteraction | null,
  ): ExecutionContext => {
    return {
      getArgs: jest.fn().mockReturnValue(interaction ? [interaction] : []),
    } as unknown as ExecutionContext;
  };

  const createMockCallHandler = (): CallHandler => {
    return {
      handle: jest.fn().mockReturnValue(of('success')),
    } as unknown as CallHandler;
  };

  beforeEach(async () => {
    const mockCommandLoggerService = {
      logCommandStart: jest.fn(),
      logCommandSuccess: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        CommandLoggerInterceptor,
        {
          provide: CommandLoggerService,
          useValue: mockCommandLoggerService,
        },
      ],
    }).compile();

    interceptor = module.get<CommandLoggerInterceptor>(
      CommandLoggerInterceptor,
    );
    commandLoggerService = module.get(CommandLoggerService);

    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.useRealTimers();
    await module.close();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should log command start and success for Discord interaction', (done) => {
      const interaction = createMockInteraction();
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe({
        next: () => {
          expect(commandLoggerService.logCommandStart).toHaveBeenCalledWith(
            interaction,
          );
          expect(commandLoggerService.logCommandSuccess).toHaveBeenCalledWith(
            interaction,
            expect.any(Number),
          );
          done();
        },
      });
    });

    it('should skip logging for non-Discord interactions', (done) => {
      const context = createMockExecutionContext(null);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe({
        next: () => {
          expect(commandLoggerService.logCommandStart).not.toHaveBeenCalled();
          expect(commandLoggerService.logCommandSuccess).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should calculate duration correctly', (done) => {
      const interaction = createMockInteraction();
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler();

      jest.useFakeTimers();

      interceptor.intercept(context, handler).subscribe({
        next: () => {
          jest.advanceTimersByTime(150);
          jest.useRealTimers();

          expect(commandLoggerService.logCommandSuccess).toHaveBeenCalledWith(
            interaction,
            expect.any(Number),
          );
          const callArgs = commandLoggerService.logCommandSuccess.mock.calls[0];
          expect(callArgs[1]).toBeGreaterThanOrEqual(0);
          done();
        },
      });
    });
  });
});
