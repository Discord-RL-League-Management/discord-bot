import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { ErrorHandlingInterceptor } from './error-handling.interceptor';
import { throwError, of } from 'rxjs';
import { ChatInputCommandInteraction, User } from 'discord.js';
import { AxiosError } from 'axios';

describe('ErrorHandlingInterceptor', () => {
  let interceptor: ErrorHandlingInterceptor;
  let module: TestingModule;

  const createMockInteraction = (
    options: {
      deferred?: boolean;
      replied?: boolean;
    } = {},
  ): ChatInputCommandInteraction => {
    const { deferred = false, replied = false } = options;

    const mockUser = {
      id: '111111111111111111',
    } as User;

    return {
      user: mockUser,
      commandName: 'test',
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

  const createMockCallHandler = (
    shouldError: boolean = false,
    error?: any,
  ): CallHandler => {
    return {
      handle: jest
        .fn()
        .mockReturnValue(
          shouldError
            ? throwError(() => error || new Error('Test error'))
            : of('success'),
        ),
    } as unknown as CallHandler;
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [ErrorHandlingInterceptor],
    }).compile();

    interceptor = module.get<ErrorHandlingInterceptor>(
      ErrorHandlingInterceptor,
    );

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should pass through successful responses', (done) => {
      const interaction = createMockInteraction();
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler(false);

      interceptor.intercept(context, handler).subscribe({
        next: (value) => {
          expect(value).toBe('success');
          expect(interaction.reply).not.toHaveBeenCalled();
          expect(interaction.followUp).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should send error message via reply when interaction not deferred or replied', (done) => {
      const interaction = createMockInteraction({
        deferred: false,
        replied: false,
      });
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler(true, new Error('Test error'));

      interceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(interaction.reply).toHaveBeenCalledWith({
            embeds: expect.arrayContaining([
              expect.objectContaining({
                data: expect.objectContaining({
                  title: '❌ Error',
                }),
              }),
            ]),
            ephemeral: true,
          });
          done();
        },
      });
    });

    it('should send error message via followUp when interaction is deferred', (done) => {
      const interaction = createMockInteraction({
        deferred: true,
        replied: false,
      });
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler(true, new Error('Test error'));

      interceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: expect.arrayContaining([
              expect.objectContaining({
                data: expect.objectContaining({
                  title: '❌ Error',
                }),
              }),
            ]),
            ephemeral: true,
          });
          expect(interaction.reply).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should send error message via followUp when interaction is replied', (done) => {
      const interaction = createMockInteraction({
        deferred: false,
        replied: true,
      });
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler(true, new Error('Test error'));

      interceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: expect.arrayContaining([
              expect.objectContaining({
                data: expect.objectContaining({
                  title: '❌ Error',
                }),
              }),
            ]),
            ephemeral: true,
          });
          expect(interaction.reply).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should extract error message from AxiosError with response data', (done) => {
      const interaction = createMockInteraction();
      const context = createMockExecutionContext(interaction);
      const axiosError = new AxiosError('API Error');
      axiosError.response = {
        data: {
          message: 'User-friendly error message',
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      };
      const handler = createMockCallHandler(true, axiosError);

      interceptor.intercept(context, handler).subscribe({
        error: () => {
          expect(interaction.reply).toHaveBeenCalled();
          const replyCall = (interaction.reply as jest.Mock).mock.calls[0][0];
          expect(replyCall.embeds[0].data.description).toBe(
            'User-friendly error message',
          );
          done();
        },
      });
    });

    it('should use generic message for Error without user-friendly message', (done) => {
      const interaction = createMockInteraction();
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler(true, new Error('Internal error'));

      interceptor.intercept(context, handler).subscribe({
        error: () => {
          expect(interaction.reply).toHaveBeenCalled();
          const replyCall = (interaction.reply as jest.Mock).mock.calls[0][0];
          expect(replyCall.embeds[0].data.description).toBe(
            'An error occurred while processing your request. Please try again later.',
          );
          done();
        },
      });
    });

    it('should use generic message for unknown error types', (done) => {
      const interaction = createMockInteraction();
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler(true, 'String error');

      interceptor.intercept(context, handler).subscribe({
        error: () => {
          expect(interaction.reply).toHaveBeenCalled();
          const replyCall = (interaction.reply as jest.Mock).mock.calls[0][0];
          expect(replyCall.embeds[0].data.description).toBe(
            'An unexpected error occurred. Please try again later.',
          );
          done();
        },
      });
    });

    it('should handle AxiosError without response data message', (done) => {
      const interaction = createMockInteraction();
      const context = createMockExecutionContext(interaction);
      const axiosError = new AxiosError('API Error');
      axiosError.response = {
        data: {},
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };
      const handler = createMockCallHandler(true, axiosError);

      interceptor.intercept(context, handler).subscribe({
        error: () => {
          expect(interaction.reply).toHaveBeenCalled();
          const replyCall = (interaction.reply as jest.Mock).mock.calls[0][0];
          expect(replyCall.embeds[0].data.description).toBe(
            'An error occurred while processing your request. Please try again later.',
          );
          done();
        },
      });
    });

    it('should handle reply errors gracefully', (done) => {
      const interaction = createMockInteraction();
      (interaction.reply as jest.Mock).mockRejectedValue(
        new Error('Reply failed'),
      );
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler(true, new Error('Test error'));

      interceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(interaction.reply).toHaveBeenCalled();
          // Error should still be re-thrown
          done();
        },
      });
    });

    it('should handle followUp errors gracefully', (done) => {
      const interaction = createMockInteraction({
        deferred: true,
        replied: false,
      });
      (interaction.followUp as jest.Mock).mockRejectedValue(
        new Error('FollowUp failed'),
      );
      const context = createMockExecutionContext(interaction);
      const handler = createMockCallHandler(true, new Error('Test error'));

      interceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          expect(interaction.followUp).toHaveBeenCalled();
          // Error should still be re-thrown
          done();
        },
      });
    });

    it('should skip error handling for non-Discord interactions', (done) => {
      const context = createMockExecutionContext(null);
      const handler = createMockCallHandler(true, new Error('Test error'));

      interceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(Error);
          // Should not try to send Discord messages
          done();
        },
      });
    });

    it('should re-throw error after handling', (done) => {
      const interaction = createMockInteraction();
      const context = createMockExecutionContext(interaction);
      const originalError = new Error('Original error');
      const handler = createMockCallHandler(true, originalError);

      interceptor.intercept(context, handler).subscribe({
        error: (error) => {
          expect(error).toBe(originalError);
          expect(interaction.reply).toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
