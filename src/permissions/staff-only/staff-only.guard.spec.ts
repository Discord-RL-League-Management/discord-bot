import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { StaffOnlyGuard } from './staff-only.guard';
import { ApiService } from '../../api/api.service';
import { ChatInputCommandInteraction, GuildMember } from 'discord.js';

describe('StaffOnlyGuard', () => {
  let guard: StaffOnlyGuard;
  let apiService: jest.Mocked<ApiService>;
  let module: TestingModule;

  const createMockInteraction = (
    options: {
      guildId?: string | null;
      inGuild?: boolean;
      member?: GuildMember | null;
      replied?: boolean;
      deferred?: boolean;
    } = {},
  ): ChatInputCommandInteraction => {
    const {
      guildId = '987654321098765432',
      inGuild = true,
      member = null,
      replied = false,
      deferred = false,
    } = options;

    return {
      user: { id: '123456789012345678' },
      guildId,
      commandName: 'test-command',
      inGuild: jest.fn().mockReturnValue(inGuild),
      member,
      replied,
      deferred,
      reply: jest.fn().mockResolvedValue(undefined),
      followUp: jest.fn().mockResolvedValue(undefined),
    } as unknown as ChatInputCommandInteraction;
  };

  const createMockMember = (roleIds: string[] = []): GuildMember => {
    const roleCache = new Map();
    roleIds.forEach((id) => roleCache.set(id, { id }));

    return {
      roles: {
        cache: roleCache,
      },
    } as unknown as GuildMember;
  };

  const createMockExecutionContext = (
    interaction: ChatInputCommandInteraction | null,
  ): ExecutionContext => {
    return {
      getArgs: jest.fn().mockReturnValue(interaction ? [interaction] : []),
      switchToHttp: jest.fn(),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const mockApiService = {
      getGuildSettings: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        StaffOnlyGuard,
        {
          provide: ApiService,
          useValue: mockApiService,
        },
      ],
    }).compile();

    guard = module.get<StaffOnlyGuard>(StaffOnlyGuard);
    apiService = module.get(ApiService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no Discord interaction', async () => {
      const context = createMockExecutionContext(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(apiService.getGuildSettings).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException in DM context', async () => {
      const interaction = createMockInteraction({
        guildId: null,
        inGuild: false,
      });
      const context = createMockExecutionContext(interaction);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).toHaveBeenCalledWith({
        content: '❌ This command can only be used in servers.',
        ephemeral: true,
      });
    });

    it('should throw ForbiddenException when member is missing', async () => {
      const interaction = createMockInteraction({
        member: null,
      });
      const context = createMockExecutionContext(interaction);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).toHaveBeenCalledWith({
        content: '❌ Unable to verify permissions.',
        ephemeral: true,
      });
      expect(apiService.getGuildSettings).not.toHaveBeenCalled();
    });

    it('should return true when user has staff role', async () => {
      const member = createMockMember(['staff-role-id-1', 'other-role-id']);
      const interaction = createMockInteraction({ member });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({
        staffRoles: ['staff-role-id-1', 'staff-role-id-2'],
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(apiService.getGuildSettings).toHaveBeenCalledWith(
        interaction.guildId,
      );
    });

    it('should throw ForbiddenException when user lacks staff role', async () => {
      const member = createMockMember(['regular-role-id']);
      const interaction = createMockInteraction({ member });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({
        staffRoles: ['staff-role-id-1', 'staff-role-id-2'],
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).toHaveBeenCalledWith({
        content:
          '❌ You do not have permission to use this command. This command is restricted to staff members.',
        ephemeral: true,
      });
    });

    it('should throw ForbiddenException when no staff roles configured', async () => {
      const member = createMockMember(['any-role-id']);
      const interaction = createMockInteraction({ member });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({
        staffRoles: [],
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).toHaveBeenCalledWith({
        content:
          '❌ You do not have permission to use this command. This command is restricted to staff members.',
        ephemeral: true,
      });
    });

    it('should throw ForbiddenException when staffRoles is missing from settings', async () => {
      const member = createMockMember(['any-role-id']);
      const interaction = createMockInteraction({ member });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should handle API errors gracefully', async () => {
      const member = createMockMember(['any-role-id']);
      const interaction = createMockInteraction({ member });
      const context = createMockExecutionContext(interaction);

      const error = new Error('API connection failed');
      apiService.getGuildSettings.mockRejectedValue(error);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).toHaveBeenCalledWith({
        content:
          'An error occurred while checking staff permissions. Please try again later.',
        ephemeral: true,
      });
    });

    it('should re-throw ForbiddenException if already thrown', async () => {
      const member = createMockMember(['any-role-id']);
      const interaction = createMockInteraction({ member });
      const context = createMockExecutionContext(interaction);

      const forbiddenError = new ForbiddenException('Already forbidden');
      apiService.getGuildSettings.mockRejectedValue(forbiddenError);

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).not.toHaveBeenCalled();
    });

    it('should send denial message via followUp when already replied', async () => {
      const member = createMockMember(['regular-role-id']);
      const interaction = createMockInteraction({
        member,
        replied: true,
      });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({
        staffRoles: ['staff-role-id'],
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.followUp).toHaveBeenCalledWith({
        content:
          '❌ You do not have permission to use this command. This command is restricted to staff members.',
        ephemeral: true,
      });
      expect(interaction.reply).not.toHaveBeenCalled();
    });

    it('should handle error sending denial message gracefully', async () => {
      const member = createMockMember(['regular-role-id']);
      const interaction = createMockInteraction({
        member,
        reply: jest.fn().mockRejectedValue(new Error('Send failed')),
      });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({
        staffRoles: ['staff-role-id'],
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).toHaveBeenCalled();
    });

    it('should check multiple staff roles correctly', async () => {
      const member = createMockMember(['staff-role-id-2']);
      const interaction = createMockInteraction({ member });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockResolvedValue({
        staffRoles: ['staff-role-id-1', 'staff-role-id-2', 'staff-role-id-3'],
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle non-Error rejection from API', async () => {
      const member = createMockMember(['any-role-id']);
      const interaction = createMockInteraction({ member });
      const context = createMockExecutionContext(interaction);

      apiService.getGuildSettings.mockRejectedValue('String error');

      await expect(guard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );

      expect(interaction.reply).toHaveBeenCalledWith({
        content:
          'An error occurred while checking staff permissions. Please try again later.',
        ephemeral: true,
      });
    });
  });
});
