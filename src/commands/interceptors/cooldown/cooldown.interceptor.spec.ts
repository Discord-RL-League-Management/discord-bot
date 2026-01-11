import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { CooldownInterceptor } from './cooldown.interceptor';
import { of } from 'rxjs';
import { ChatInputCommandInteraction, User } from 'discord.js';

describe('CooldownInterceptor', () => {
  let interceptor: CooldownInterceptor;
  let module: TestingModule;

  const createMockInteraction = (
    userId: string,
    commandName: string,
    options: {
      deferred?: boolean;
      replied?: boolean;
    } = {},
  ): ChatInputCommandInteraction => {
    const { deferred = false, replied = false } = options;

    const mockUser = {
      id: userId,
    } as User;

    return {
      user: mockUser,
      commandName,
      deferred,
      replied,
      reply: jest.fn().mockResolvedValue(undefined),
      followUp: jest.fn().mockResolvedValue(undefined),
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
    module = await Test.createTestingModule({
      providers: [CooldownInterceptor],
    }).compile();

    interceptor = module.get<CooldownInterceptor>(CooldownInterceptor);

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
    it('should allow command execution when no cooldown exists', (done) => {
      const interaction = createMockInteraction('111111111111111111', 'test');
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe({
        next: (value) => {
          expect(value).toBe('success');
          expect(handler.handle).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should allow command execution when cooldown has expired', (done) => {
      const interaction = createMockInteraction('111111111111111111', 'test');
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler();

      // First call sets cooldown
      interceptor.intercept(context, handler).subscribe();

      // Advance time past cooldown (3 seconds)
      jest.advanceTimersByTime(3100);

      // Second call should succeed
      interceptor.intercept(context, handler).subscribe({
        next: (value) => {
          expect(value).toBe('success');
          expect(handler.handle).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should block command execution when cooldown is active', (done) => {
      const interaction = createMockInteraction('111111111111111111', 'test');
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler();

      // First call sets cooldown
      interceptor.intercept(context, handler).subscribe({
        complete: () => {
          // Second call immediately after should be blocked
          interceptor.intercept(context, handler).subscribe({
            error: (error) => {
              expect(error).toBeInstanceOf(ForbiddenException);
              expect(error.message).toBe('Command is on cooldown');
              expect(handler.handle).toHaveBeenCalledTimes(1); // Only first call
              done();
            },
            complete: () => {
              done(new Error('Expected error but got completion'));
            },
          });
        },
      });
    });

    it('should send cooldown message via reply when interaction not deferred or replied', (done) => {
      const interaction = createMockInteraction('111111111111111111', 'test', {
        deferred: false,
        replied: false,
      });
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler();

      // First call sets cooldown
      interceptor.intercept(context, handler).subscribe();

      // Second call should send reply
      interceptor.intercept(context, handler).subscribe({
        error: () => {
          expect(interaction.reply).toHaveBeenCalledWith({
            content: expect.stringContaining('Please wait'),
            ephemeral: true,
          });
          done();
        },
      });
    });

    it('should send cooldown message via followUp when interaction is deferred', (done) => {
      const interaction = createMockInteraction('111111111111111111', 'test', {
        deferred: true,
        replied: false,
      });
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler();

      // First call sets cooldown
      interceptor.intercept(context, handler).subscribe();

      // Second call should send followUp
      interceptor.intercept(context, handler).subscribe({
        error: () => {
          expect(interaction.followUp).toHaveBeenCalledWith({
            content: expect.stringContaining('Please wait'),
            ephemeral: true,
          });
          expect(interaction.reply).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should send cooldown message via followUp when interaction is replied', (done) => {
      const interaction = createMockInteraction('111111111111111111', 'test', {
        deferred: false,
        replied: true,
      });
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler();

      // First call sets cooldown
      interceptor.intercept(context, handler).subscribe();

      // Second call should send followUp
      interceptor.intercept(context, handler).subscribe({
        error: () => {
          expect(interaction.followUp).toHaveBeenCalledWith({
            content: expect.stringContaining('Please wait'),
            ephemeral: true,
          });
          expect(interaction.reply).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle different users independently', (done) => {
      const interaction1 = createMockInteraction('111111111111111111', 'test');
      const interaction2 = createMockInteraction('222222222222222222', 'test');
      const context1 = createMockExecutionContext(interaction1);
      const context2 = createMockExecutionContext(interaction2);
      const handler = createMockCallHandler();

      // First user sets cooldown
      interceptor.intercept(context1, handler).subscribe();

      // Second user should be able to execute immediately
      interceptor.intercept(context2, handler).subscribe({
        next: (value) => {
          expect(value).toBe('success');
          expect(handler.handle).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle different commands independently', (done) => {
      const interaction1 = createMockInteraction('111111111111111111', 'test1');
      const interaction2 = createMockInteraction('111111111111111111', 'test2');
      const context1 = createMockExecutionContext(interaction1);
      const context2 = createMockExecutionContext(interaction2);
      const handler = createMockCallHandler();

      // First command sets cooldown
      interceptor.intercept(context1, handler).subscribe();

      // Second command should be able to execute immediately
      interceptor.intercept(context2, handler).subscribe({
        next: (value) => {
          expect(value).toBe('success');
          expect(handler.handle).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should skip cooldown check for non-Discord interactions', (done) => {
      const context = createMockExecutionContext(null);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe({
        next: (value) => {
          expect(value).toBe('success');
          expect(handler.handle).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle reply errors gracefully', (done) => {
      const interaction = createMockInteraction('111111111111111111', 'test', {
        deferred: false,
        replied: false,
      });
      (interaction.reply as jest.Mock).mockRejectedValue(
        new Error('Reply failed'),
      );
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler();

      // First call sets cooldown
      interceptor.intercept(context, handler).subscribe();

      // Second call should still throw ForbiddenException even if reply fails
      interceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(ForbiddenException);
          expect(interaction.reply).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle followUp errors gracefully', (done) => {
      const interaction = createMockInteraction('111111111111111111', 'test', {
        deferred: true,
        replied: false,
      });
      (interaction.followUp as jest.Mock).mockRejectedValue(
        new Error('FollowUp failed'),
      );
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler();

      // First call sets cooldown
      interceptor.intercept(context, handler).subscribe();

      // Second call should still throw ForbiddenException even if followUp fails
      interceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(ForbiddenException);
          expect(interaction.followUp).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should cleanup old cooldowns when map size exceeds 1000', () => {
      const handler = createMockCallHandler();

      // Create many cooldowns
      for (let i = 0; i < 1001; i++) {
        const interaction = createMockInteraction(
          `${i}`.padStart(18, '0'),
          'test',
        );
        const context = createMockExecutionContext(interaction);
        interceptor.intercept(context, handler).subscribe();
      }

      // Advance time past cooldown
      jest.advanceTimersByTime(3100);

      // Next call should trigger cleanup
      const interaction = createMockInteraction('999999999999999999', 'test');
      const context = createMockExecutionContext(interaction);
      interceptor.intercept(context, handler).subscribe({
        next: (value) => {
          expect(value).toBe('success');
          expect(handler.handle).toHaveBeenCalled();
        },
      });
    });
  });

  describe('onApplicationShutdown', () => {
    it('should cleanup cooldowns on shutdown', () => {
      const interaction = createMockInteraction('111111111111111111', 'test');
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler();

      // Set a cooldown
      interceptor.intercept(context, handler).subscribe();

      // Shutdown should clear cooldowns
      interceptor.onApplicationShutdown();

      // After shutdown, should be able to execute immediately
      interceptor.intercept(context, handler).subscribe({
        next: (value) => {
          expect(value).toBe('success');
        },
      });
    });
  });
});
