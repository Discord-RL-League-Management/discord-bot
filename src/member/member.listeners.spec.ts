import { Test, TestingModule } from '@nestjs/testing';
import { GuildMember, Guild, User, Collection, Role } from 'discord.js';
import { MemberListeners } from './member.listeners';
import { MemberService } from './member.service';

describe('MemberListeners', () => {
  let listeners: MemberListeners;
  let module: TestingModule;
  let memberService: jest.Mocked<MemberService>;

  const mockMemberService = {
    handleMemberJoin: jest.fn(),
    handleMemberLeave: jest.fn(),
    handleMemberUpdate: jest.fn(),
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

  beforeEach(async () => {
    mockMemberService.handleMemberJoin.mockClear();
    mockMemberService.handleMemberLeave.mockClear();
    mockMemberService.handleMemberUpdate.mockClear();

    module = await Test.createTestingModule({
      providers: [
        MemberListeners,
        {
          provide: MemberService,
          useValue: mockMemberService,
        },
      ],
    }).compile();

    listeners = module.get<MemberListeners>(MemberListeners);
    memberService = module.get(MemberService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await module.close();
  });

  it('should be defined', () => {
    expect(listeners).toBeDefined();
  });

  describe('onGuildMemberAdd', () => {
    it('should call memberService.handleMemberJoin with correct member', async () => {
      const mockGuild = createMockGuild('123456789012345678', 'Test Guild');
      const mockUser = createMockUser('222222222222222222', 'testuser', false);
      const mockMember = createMockMember(mockUser, mockGuild, []);
      mockMemberService.handleMemberJoin.mockResolvedValue(undefined);

      await listeners.onGuildMemberAdd([mockMember]);

      expect(memberService.handleMemberJoin).toHaveBeenCalledTimes(1);
      expect(memberService.handleMemberJoin).toHaveBeenCalledWith(mockMember);
    });

    it('should propagate errors from memberService.handleMemberJoin', async () => {
      const mockGuild = createMockGuild('123456789012345678', 'Test Guild');
      const mockUser = createMockUser('222222222222222222', 'testuser', false);
      const mockMember = createMockMember(mockUser, mockGuild, []);
      const error = new Error('API error');
      mockMemberService.handleMemberJoin.mockRejectedValue(error);

      await expect(listeners.onGuildMemberAdd([mockMember])).rejects.toThrow(
        'API error',
      );

      expect(memberService.handleMemberJoin).toHaveBeenCalledTimes(1);
    });
  });

  describe('onGuildMemberRemove', () => {
    it('should call memberService.handleMemberLeave with correct member', async () => {
      const mockGuild = createMockGuild('123456789012345678', 'Test Guild');
      const mockUser = createMockUser('222222222222222222', 'testuser', false);
      const mockMember = createMockMember(mockUser, mockGuild, []);
      mockMemberService.handleMemberLeave.mockResolvedValue(undefined);

      await listeners.onGuildMemberRemove([mockMember]);

      expect(memberService.handleMemberLeave).toHaveBeenCalledTimes(1);
      expect(memberService.handleMemberLeave).toHaveBeenCalledWith(mockMember);
    });

    it('should propagate errors from memberService.handleMemberLeave', async () => {
      const mockGuild = createMockGuild('123456789012345678', 'Test Guild');
      const mockUser = createMockUser('222222222222222222', 'testuser', false);
      const mockMember = createMockMember(mockUser, mockGuild, []);
      const error = new Error('API error');
      mockMemberService.handleMemberLeave.mockRejectedValue(error);

      await expect(listeners.onGuildMemberRemove([mockMember])).rejects.toThrow(
        'API error',
      );

      expect(memberService.handleMemberLeave).toHaveBeenCalledTimes(1);
    });
  });

  describe('onGuildMemberUpdate', () => {
    it('should call memberService.handleMemberUpdate with correct oldMember and newMember', async () => {
      const mockGuild = createMockGuild('123456789012345678', 'Test Guild');
      const mockUser = createMockUser('222222222222222222', 'testuser', false);
      const oldMember = createMockMember(mockUser, mockGuild, []);
      const newMember = createMockMember(mockUser, mockGuild, [
        '333333333333333333',
      ]);
      mockMemberService.handleMemberUpdate.mockResolvedValue(undefined);

      await listeners.onGuildMemberUpdate([oldMember, newMember]);

      expect(memberService.handleMemberUpdate).toHaveBeenCalledTimes(1);
      expect(memberService.handleMemberUpdate).toHaveBeenCalledWith(
        oldMember,
        newMember,
      );
    });

    it('should cast oldMember to GuildMember type', async () => {
      const mockGuild = createMockGuild('123456789012345678', 'Test Guild');
      const mockUser = createMockUser('222222222222222222', 'testuser', false);
      const oldMember = createMockMember(mockUser, mockGuild, []);
      const newMember = createMockMember(mockUser, mockGuild, []);
      mockMemberService.handleMemberUpdate.mockResolvedValue(undefined);

      await listeners.onGuildMemberUpdate([oldMember, newMember]);

      expect(memberService.handleMemberUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        newMember,
      );
    });

    it('should propagate errors from memberService.handleMemberUpdate', async () => {
      const mockGuild = createMockGuild('123456789012345678', 'Test Guild');
      const mockUser = createMockUser('222222222222222222', 'testuser', false);
      const oldMember = createMockMember(mockUser, mockGuild, []);
      const newMember = createMockMember(mockUser, mockGuild, [
        '333333333333333333',
      ]);
      const error = new Error('API error');
      mockMemberService.handleMemberUpdate.mockRejectedValue(error);

      await expect(
        listeners.onGuildMemberUpdate([oldMember, newMember]),
      ).rejects.toThrow('API error');

      expect(memberService.handleMemberUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
