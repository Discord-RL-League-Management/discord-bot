import { Test, TestingModule } from '@nestjs/testing';
import {
  GuildMember,
  PartialGuildMember,
  Guild,
  User,
  Collection,
  Role,
} from 'discord.js';
import { MemberService } from './member.service';
import { ApiService } from '../api/api.service';
import { ApiError } from '../api/api-error.interface';
import { AppLogger } from '../common/app-logger.service';

describe('MemberService', () => {
  let service: MemberService;
  let module: TestingModule;
  let apiService: jest.Mocked<ApiService>;
  let loggerSpy: {
    log: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  const mockApiService = {
    createGuildMember: jest.fn(),
    updateGuildMember: jest.fn(),
    removeGuildMember: jest.fn(),
  };

  const createMockGuild = (id: string, name: string): Guild => {
    return {
      id,
      name,
    } as Guild;
  };

  const createMockUser = (
    id: string,
    username: string,
    isBot: boolean,
  ): User => {
    return {
      id,
      username,
      bot: isBot,
    } as User;
  };

  const createMockMember = (
    user: User,
    guild: Guild,
    roleIds: string[],
    nickname?: string | null,
  ): GuildMember => {
    const rolesCache = new Collection<string, Role>();
    roleIds.forEach((roleId) => {
      rolesCache.set(roleId, { id: roleId } as Role);
    });

    return {
      user,
      guild,
      nickname: nickname || null,
      roles: {
        cache: rolesCache,
      },
    } as unknown as GuildMember;
  };

  const createPartialMember = (
    user: User | null | undefined,
    guild: Guild | null | undefined,
  ): PartialGuildMember => {
    return {
      user,
      guild,
    } as unknown as PartialGuildMember;
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    mockApiService.createGuildMember.mockClear();
    mockApiService.updateGuildMember.mockClear();
    mockApiService.removeGuildMember.mockClear();

    module = await Test.createTestingModule({
      providers: [
        MemberService,
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
        {
          provide: ApiService,
          useValue: mockApiService,
        },
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
    apiService = module.get(ApiService);

    loggerSpy = {
      log: jest.spyOn(mockLogger, 'log'),
      error: jest.spyOn(mockLogger, 'error'),
    };

    jest.clearAllMocks();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleMemberJoin', () => {
    const mockGuild = createMockGuild('123456789012345678', 'Test Guild');
    const mockUser = createMockUser('222222222222222222', 'testuser', false);

    it('should successfully create guild member when API call succeeds', async () => {
      const member = createMockMember(
        mockUser,
        mockGuild,
        ['123456789012345678', '333333333333333333'],
        'TestNick',
      );
      apiService.createGuildMember.mockResolvedValue({ created: true });

      await service.handleMemberJoin(member);

      expect(apiService.createGuildMember).toHaveBeenCalledTimes(1);
      expect(apiService.createGuildMember).toHaveBeenCalledWith(
        '123456789012345678',
        {
          userId: '222222222222222222',
          username: 'testuser',
          nickname: 'TestNick',
          roles: ['333333333333333333'], // @everyone role filtered out
        },
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Member joined: testuser in Test Guild',
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Successfully added member: testuser',
      );
    });

    it('should skip bot members', async () => {
      const botUser = createMockUser('444444444444444444', 'botuser', true);
      const botMember = createMockMember(botUser, mockGuild, []);

      await service.handleMemberJoin(botMember);

      expect(apiService.createGuildMember).not.toHaveBeenCalled();
      expect(loggerSpy.log).toHaveBeenCalledWith('Skipping bot join: botuser');
    });

    it('should handle member without nickname', async () => {
      const member = createMockMember(mockUser, mockGuild, [], null);
      apiService.createGuildMember.mockResolvedValue({ created: true });

      await service.handleMemberJoin(member);

      expect(apiService.createGuildMember).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          nickname: undefined,
        }),
      );
    });

    it('should throw error when API call fails', async () => {
      const member = createMockMember(mockUser, mockGuild, []);
      const error = new Error('API error');
      apiService.createGuildMember.mockRejectedValue(error);

      await expect(service.handleMemberJoin(member)).rejects.toThrow(
        'API error',
      );

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Error handling member join 222222222222222222:',
        'API error',
      );
    });

    it('should throw ApiError when user ID validation fails', async () => {
      const invalidUser = createMockUser('invalid', 'testuser', false);
      const member = createMockMember(invalidUser, mockGuild, []);

      await expect(service.handleMemberJoin(member)).rejects.toThrow(ApiError);
      expect(apiService.createGuildMember).not.toHaveBeenCalled();
    });

    it('should throw ApiError when guild ID validation fails', async () => {
      const invalidGuild = createMockGuild('invalid', 'Test Guild');
      const member = createMockMember(mockUser, invalidGuild, []);

      await expect(service.handleMemberJoin(member)).rejects.toThrow(ApiError);
      expect(apiService.createGuildMember).not.toHaveBeenCalled();
    });
  });

  describe('handleMemberLeave', () => {
    const mockGuild = createMockGuild('123456789012345678', 'Test Guild');
    const mockUser = createMockUser('222222222222222222', 'testuser', false);

    it('should successfully remove guild member when API call succeeds', async () => {
      const member = createMockMember(mockUser, mockGuild, []);
      apiService.removeGuildMember.mockResolvedValue({ deleted: true });

      await service.handleMemberLeave(member);

      expect(apiService.removeGuildMember).toHaveBeenCalledTimes(1);
      expect(apiService.removeGuildMember).toHaveBeenCalledWith(
        '123456789012345678',
        '222222222222222222',
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Member left: testuser from Test Guild',
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Successfully removed member: testuser',
      );
    });

    it('should throw error when user ID is missing', async () => {
      const partialMember = createPartialMember(null, mockGuild);

      await expect(service.handleMemberLeave(partialMember)).rejects.toThrow(
        'Missing user or guild ID',
      );

      expect(apiService.removeGuildMember).not.toHaveBeenCalled();
      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Error handling member leave undefined:',
        'Missing user or guild ID',
      );
    });

    it('should throw error when guild ID is missing', async () => {
      const partialMember = createPartialMember(mockUser, null);

      await expect(service.handleMemberLeave(partialMember)).rejects.toThrow(
        'Missing user or guild ID',
      );

      expect(apiService.removeGuildMember).not.toHaveBeenCalled();
    });

    it('should throw error when API call fails', async () => {
      const member = createMockMember(mockUser, mockGuild, []);
      const error = new Error('API error');
      apiService.removeGuildMember.mockRejectedValue(error);

      await expect(service.handleMemberLeave(member)).rejects.toThrow(
        'API error',
      );

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Error handling member leave 222222222222222222:',
        'API error',
      );
    });

    it('should handle partial member with missing username', async () => {
      const userWithoutUsername = { id: '222222222222222222' } as User;
      const partialMember = createPartialMember(userWithoutUsername, mockGuild);
      apiService.removeGuildMember.mockResolvedValue({ deleted: true });

      await service.handleMemberLeave(partialMember as unknown as GuildMember);

      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Member left: Unknown from Test Guild',
      );
    });
  });

  describe('handleMemberUpdate', () => {
    const mockGuild = createMockGuild('123456789012345678', 'Test Guild');
    const mockUser = createMockUser('222222222222222222', 'testuser', false);

    it('should update member when roles change', async () => {
      const oldMember = createMockMember(mockUser, mockGuild, [
        '333333333333333333',
      ]);
      const newMember = createMockMember(
        mockUser,
        mockGuild,
        ['333333333333333333', '444444444444444444'],
        'NewNick',
      );
      apiService.updateGuildMember.mockResolvedValue({ updated: true });

      await service.handleMemberUpdate(oldMember, newMember);

      expect(apiService.updateGuildMember).toHaveBeenCalledTimes(1);
      expect(apiService.updateGuildMember).toHaveBeenCalledWith(
        '123456789012345678',
        '222222222222222222',
        {
          username: 'testuser',
          nickname: 'NewNick',
          roles: ['333333333333333333', '444444444444444444'],
        },
      );
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Member updated: testuser in Test Guild',
      );
    });

    it('should update member when nickname changes', async () => {
      const oldMember = createMockMember(mockUser, mockGuild, [], 'OldNick');
      const newMember = createMockMember(mockUser, mockGuild, [], 'NewNick');
      apiService.updateGuildMember.mockResolvedValue({ updated: true });

      await service.handleMemberUpdate(oldMember, newMember);

      expect(apiService.updateGuildMember).toHaveBeenCalledTimes(1);
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Successfully updated member: testuser',
      );
    });

    it('should update member when username changes', async () => {
      const oldUser = createMockUser(
        '222222222222222222',
        'oldusername',
        false,
      );
      const newUser = createMockUser(
        '222222222222222222',
        'newusername',
        false,
      );
      const oldMember = createMockMember(oldUser, mockGuild, []);
      const newMember = createMockMember(newUser, mockGuild, []);
      apiService.updateGuildMember.mockResolvedValue({ updated: true });

      await service.handleMemberUpdate(oldMember, newMember);

      expect(apiService.updateGuildMember).toHaveBeenCalledTimes(1);
    });

    it('should not update member when nothing changes', async () => {
      const member = createMockMember(
        mockUser,
        mockGuild,
        ['333333333333333333'],
        'Nick',
      );
      const sameMember = createMockMember(
        mockUser,
        mockGuild,
        ['333333333333333333'],
        'Nick',
      );

      await service.handleMemberUpdate(member, sameMember);

      expect(apiService.updateGuildMember).not.toHaveBeenCalled();
      expect(loggerSpy.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Member updated'),
      );
    });

    it('should skip bot members', async () => {
      const botUser = createMockUser('444444444444444444', 'botuser', true);
      const oldMember = createMockMember(botUser, mockGuild, []);
      const newMember = createMockMember(botUser, mockGuild, [
        '555555555555555555',
      ]);

      await service.handleMemberUpdate(oldMember, newMember);

      expect(apiService.updateGuildMember).not.toHaveBeenCalled();
      expect(loggerSpy.log).toHaveBeenCalledWith(
        'Skipping bot update: botuser',
      );
    });

    it('should filter out @everyone role from roles list', async () => {
      const oldMember = createMockMember(mockUser, mockGuild, []);
      const newMember = createMockMember(
        mockUser,
        mockGuild,
        ['123456789012345678', '333333333333333333'], // Includes guild ID (@everyone)
      );
      apiService.updateGuildMember.mockResolvedValue({ updated: true });

      await service.handleMemberUpdate(oldMember, newMember);

      expect(apiService.updateGuildMember).toHaveBeenCalledWith(
        '123456789012345678',
        '222222222222222222',
        expect.objectContaining({
          roles: ['333333333333333333'], // @everyone role filtered out
        }),
      );
    });

    it('should throw error when API call fails', async () => {
      const oldMember = createMockMember(mockUser, mockGuild, []);
      const newMember = createMockMember(mockUser, mockGuild, [
        '333333333333333333',
      ]);
      const error = new Error('API error');
      apiService.updateGuildMember.mockRejectedValue(error);

      await expect(
        service.handleMemberUpdate(oldMember, newMember),
      ).rejects.toThrow('API error');

      expect(loggerSpy.error).toHaveBeenCalledWith(
        'Error handling member update 222222222222222222:',
        'API error',
      );
    });

    it('should throw ApiError when user ID validation fails', async () => {
      const invalidUser = createMockUser('invalid', 'testuser', false);
      const oldMember = createMockMember(mockUser, mockGuild, []);
      const newMember = createMockMember(invalidUser, mockGuild, [
        '333333333333333333',
      ]);

      await expect(
        service.handleMemberUpdate(oldMember, newMember),
      ).rejects.toThrow(ApiError);

      expect(apiService.updateGuildMember).not.toHaveBeenCalled();
    });
  });
});
