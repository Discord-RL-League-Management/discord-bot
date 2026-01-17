import { Test, TestingModule } from '@nestjs/testing';
import { PermissionValidatorService } from './permission-validator.service';
import { ApiService } from '../../api/api.service';
import { ConfigService } from '../../config/config.service';
import {
  ChatInputCommandInteraction,
  GuildMember,
  PermissionFlagsBits,
} from 'discord.js';
import { PermissionMetadata } from '../permission-metadata.interface';
import { AppLogger } from '../../common/app-logger.service';

describe('PermissionValidatorService', () => {
  let service: PermissionValidatorService;
  let apiService: jest.Mocked<ApiService>;
  let configService: jest.Mocked<ConfigService>;
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
    commandName: 'test-command',
    inGuild: jest.fn().mockReturnValue(true),
    member: {
      id: '123456789012345678',
      permissions: {
        has: jest.fn(),
      },
      roles: {
        cache: {
          keys: jest.fn().mockReturnValue(['role1', 'role2']),
        },
      },
    } as unknown as GuildMember,
  } as unknown as ChatInputCommandInteraction;

  beforeEach(async () => {
    const mockApiService = {
      getGuildSettings: jest.fn(),
    };

    const mockConfigService = {
      getSuperUserId: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        PermissionValidatorService,
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
        {
          provide: ApiService,
          useValue: mockApiService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PermissionValidatorService>(
      PermissionValidatorService,
    );
    apiService = module.get(ApiService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCommandPermissions', () => {
    it('should allow access when no metadata provided', async () => {
      const result = await service.validateCommandPermissions(mockInteraction);
      expect(result.allowed).toBe(true);
    });

    it('should deny access when requiresGuild is true and not in guild', async () => {
      const metadata: PermissionMetadata = { requiresGuild: true };
      const dmInteraction = {
        ...mockInteraction,
        inGuild: jest.fn().mockReturnValue(false),
      } as unknown as ChatInputCommandInteraction;

      const result = await service.validateCommandPermissions(
        dmInteraction,
        metadata,
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('This command can only be used in servers');
    });

    it('should allow access in DM when no guild requirement', async () => {
      const metadata: PermissionMetadata = {
        requiredPermissions: PermissionFlagsBits.Administrator,
      };
      const dmInteraction = {
        ...mockInteraction,
        inGuild: jest.fn().mockReturnValue(false),
        member: null,
      } as unknown as ChatInputCommandInteraction;

      const result = await service.validateCommandPermissions(
        dmInteraction,
        metadata,
      );
      expect(result.allowed).toBe(true);
    });

    it('should deny access when requiresSuperUser is true and user is not super user', async () => {
      const metadata: PermissionMetadata = { requiresSuperUser: true };
      configService.getSuperUserId.mockReturnValue('999999999999999999');

      const result = await service.validateCommandPermissions(
        mockInteraction,
        metadata,
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        'You do not have permission to use this command.',
      );
    });

    it('should allow access when requiresSuperUser is true and user is super user', async () => {
      const metadata: PermissionMetadata = { requiresSuperUser: true };
      configService.getSuperUserId.mockReturnValue('123456789012345678');

      const result = await service.validateCommandPermissions(
        mockInteraction,
        metadata,
      );
      expect(result.allowed).toBe(true);
    });

    it('should deny access when super user ID is not configured', async () => {
      const metadata: PermissionMetadata = { requiresSuperUser: true };
      configService.getSuperUserId.mockReturnValue(undefined);

      const result = await service.validateCommandPermissions(
        mockInteraction,
        metadata,
      );
      expect(result.allowed).toBe(false);
    });

    it('should allow access when member has Administrator permission', async () => {
      const metadata: PermissionMetadata = {
        requiredPermissions: PermissionFlagsBits.Administrator,
      };
      const member = mockInteraction.member as GuildMember;
      jest
        .spyOn(member.permissions, 'has')
        .mockImplementation()
        .mockReturnValue(true);

      const result = await service.validateCommandPermissions(
        mockInteraction,
        metadata,
      );
      expect(result.allowed).toBe(true);
      expect(member.permissions.has).toHaveBeenCalledWith(
        PermissionFlagsBits.Administrator,
      );
    });

    it('should deny access when member does not have required permissions', async () => {
      const metadata: PermissionMetadata = {
        requiredPermissions: PermissionFlagsBits.ManageChannels,
      };
      const member = mockInteraction.member as GuildMember;
      jest
        .spyOn(member.permissions, 'has')
        .mockImplementation()
        .mockReturnValue(false);

      const result = await service.validateCommandPermissions(
        mockInteraction,
        metadata,
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        'You do not have permission to use this command',
      );
    });

    it('should allow access when requiresStaffRole is true and user has staff role', async () => {
      const metadata: PermissionMetadata = { requiresStaffRole: true };
      apiService.getGuildSettings.mockResolvedValue({
        staffRoles: ['role1', 'role3'],
      });

      const result = await service.validateCommandPermissions(
        mockInteraction,
        metadata,
      );
      expect(result.allowed).toBe(true);
      expect(apiService.getGuildSettings).toHaveBeenCalledWith(
        '987654321098765432',
      );
    });

    it('should deny access when requiresStaffRole is true and user does not have staff role', async () => {
      const metadata: PermissionMetadata = { requiresStaffRole: true };
      apiService.getGuildSettings.mockResolvedValue({
        staffRoles: ['role3', 'role4'],
      });

      const result = await service.validateCommandPermissions(
        mockInteraction,
        metadata,
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(
        'You do not have permission to use this command',
      );
    });

    it('should deny access when requiresStaffRole is true and no staff roles configured', async () => {
      const metadata: PermissionMetadata = { requiresStaffRole: true };
      apiService.getGuildSettings.mockResolvedValue({
        staffRoles: [],
      });

      const result = await service.validateCommandPermissions(
        mockInteraction,
        metadata,
      );
      expect(result.allowed).toBe(false);
    });

    it('should allow access when requiresStaffRole is true but staffRoles is undefined', async () => {
      const metadata: PermissionMetadata = { requiresStaffRole: true };
      apiService.getGuildSettings.mockResolvedValue({});

      const result = await service.validateCommandPermissions(
        mockInteraction,
        metadata,
      );
      expect(result.allowed).toBe(false);
    });

    it('should allow access when API error occurs and fails open', async () => {
      const metadata: PermissionMetadata = { requiresStaffRole: true };
      apiService.getGuildSettings.mockRejectedValue(new Error('API error'));

      const result = await service.validateCommandPermissions(
        mockInteraction,
        metadata,
      );
      expect(result.allowed).toBe(true);
    });

    it('should handle permission check error gracefully', async () => {
      const metadata: PermissionMetadata = {
        requiredPermissions: PermissionFlagsBits.ManageChannels,
      };
      const member = mockInteraction.member as GuildMember;
      jest.spyOn(member.permissions, 'has').mockImplementation(() => {
        throw new Error('Permission check error');
      });

      const result = await service.validateCommandPermissions(
        mockInteraction,
        metadata,
      );
      expect(result.allowed).toBe(false);
    });

    it('should allow access when all checks pass', async () => {
      const metadata: PermissionMetadata = {
        requiredPermissions: PermissionFlagsBits.Administrator,
        requiresGuild: true,
      };
      const member = mockInteraction.member as GuildMember;
      jest
        .spyOn(member.permissions, 'has')
        .mockImplementation()
        .mockReturnValue(true);

      const result = await service.validateCommandPermissions(
        mockInteraction,
        metadata,
      );
      expect(result.allowed).toBe(true);
    });
  });
});
