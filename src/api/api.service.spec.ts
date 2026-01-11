import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '../config/config.service';
import { ApiService } from './api.service';
import { ApiError } from './api-error.interface';
import { HealthCheckResponse } from './health-check-response.interface';
import { CreateGuildDto } from './dto/create-guild.dto';
import { of, throwError } from 'rxjs';
import { AxiosError } from 'axios';

describe('ApiService', () => {
  let service: ApiService;
  let httpService: jest.Mocked<HttpService>;
  let module: TestingModule;

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };

    const mockConfigService = {
      getApiBaseUrl: jest.fn().mockReturnValue('http://localhost:3000'),
      getApiKey: jest.fn().mockReturnValue('test-api-key'),
    };

    module = await Test.createTestingModule({
      providers: [
        ApiService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ApiService>(ApiService);
    httpService = module.get(HttpService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return health check response when API responds successfully', async () => {
      const mockResponse: HealthCheckResponse = {
        status: 'ok',
        version: '1.0.0',
      };

      httpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.healthCheck();

      expect(result).toEqual(mockResponse);
      expect(httpService.get).toHaveBeenCalledWith('/internal/health');
      expect(httpService.get).toHaveBeenCalledTimes(1);
    });

    it('should throw ApiError when response has no data', async () => {
      httpService.get.mockReturnValue(
        of({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await expect(service.healthCheck()).rejects.toThrow(ApiError);
      const error = await service.healthCheck().catch((e) => e as ApiError);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('API returned no data');
    });

    it('should transform AxiosError with response data to ApiError', async () => {
      const axiosError = {
        response: {
          status: 503,
          data: {
            message: 'Service unavailable',
            code: 'SERVICE_UNAVAILABLE',
            details: { reason: 'Maintenance' },
          },
        },
        isAxiosError: true,
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => axiosError));

      const error = await service.healthCheck().catch((e) => e as ApiError);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Service unavailable');
    });

    it('should transform AxiosError with error field to ApiError', async () => {
      const axiosError = {
        response: {
          status: 404,
          data: {
            error: 'Not Found',
            code: 'NOT_FOUND',
          },
        },
        isAxiosError: true,
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => axiosError));

      const error = await service.healthCheck().catch((e) => e as ApiError);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Not Found');
    });

    it('should transform AxiosError with no response to ApiError', async () => {
      const axiosError = {
        request: {},
        message: 'Network Error',
        isAxiosError: true,
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => axiosError));

      const error = await service.healthCheck().catch((e) => e as ApiError);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Network Error');
    });

    it('should transform non-Axios Error to Error', async () => {
      const error = new Error('Generic error');
      httpService.get.mockReturnValue(throwError(() => error));

      await expect(service.healthCheck()).rejects.toThrow('Generic error');
    });

    it('should transform string error to Error', async () => {
      httpService.get.mockReturnValue(throwError(() => 'String error'));

      const error = await service.healthCheck().catch((e) => e as Error);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('String error');
    });
  });

  describe('createGuild', () => {
    const mockGuildData: CreateGuildDto = {
      id: '123456789012345678',
      name: 'Test Guild',
      ownerId: '987654321098765432',
      memberCount: 100,
      icon: 'guild_icon',
    };

    it('should create guild successfully when API responds successfully', async () => {
      const mockResponse = { id: mockGuildData.id, name: mockGuildData.name };

      httpService.post.mockReturnValue(
        of({
          data: mockResponse,
          status: 201,
          statusText: 'Created',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.createGuild(mockGuildData);

      expect(result).toEqual(mockResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        '/internal/guilds',
        mockGuildData,
      );
    });

    it('should throw ApiError when response has no data', async () => {
      httpService.post.mockReturnValue(
        of({
          data: null,
          status: 201,
          statusText: 'Created',
          headers: {},
          config: {} as any,
        }),
      );

      const error = await service
        .createGuild(mockGuildData)
        .catch((e) => e as ApiError);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('API returned no data');
    });

    it('should transform AxiosError to ApiError on failure', async () => {
      const axiosError = {
        response: {
          status: 400,
          data: { message: 'Invalid guild data', code: 'INVALID_DATA' },
        },
        isAxiosError: true,
      } as AxiosError;

      httpService.post.mockReturnValue(throwError(() => axiosError));

      const error = await service
        .createGuild(mockGuildData)
        .catch((e) => e as ApiError);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Invalid guild data');
    });
  });

  describe('upsertGuild', () => {
    const mockGuildData: CreateGuildDto = {
      id: '123456789012345678',
      name: 'Test Guild',
      ownerId: '987654321098765432',
      memberCount: 100,
    };

    it('should upsert guild successfully when API responds successfully', async () => {
      const mockResponse = { id: mockGuildData.id, updated: true };

      httpService.post.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.upsertGuild(mockGuildData);

      expect(result).toEqual(mockResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        '/internal/guilds/upsert',
        mockGuildData,
      );
    });

    it('should throw ApiError when response has no data', async () => {
      httpService.post.mockReturnValue(
        of({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await expect(service.upsertGuild(mockGuildData)).rejects.toThrow(
        ApiError,
      );
    });

    it('should transform AxiosError with detailed logging on failure', async () => {
      const axiosError = {
        response: {
          status: 500,
          data: { message: 'Server error', code: 'SERVER_ERROR' },
        },
        isAxiosError: true,
      } as AxiosError;

      httpService.post.mockReturnValue(throwError(() => axiosError));

      await expect(service.upsertGuild(mockGuildData)).rejects.toThrow(
        ApiError,
      );
    });
  });

  describe('removeGuild', () => {
    const validGuildId = '123456789012345678';

    it('should remove guild successfully when API responds successfully', async () => {
      const mockResponse = { deleted: true };

      httpService.delete.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.removeGuild(validGuildId);

      expect(result).toEqual(mockResponse);
      expect(httpService.delete).toHaveBeenCalledWith(
        `/internal/guilds/${validGuildId}`,
      );
    });

    it('should validate Discord ID format before making request', async () => {
      const invalidId = 'invalid';

      const error = await service
        .removeGuild(invalidId)
        .catch((e) => e as ApiError);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toContain('Invalid Discord ID format');
      expect(error.code).toBe('INVALID_DISCORD_ID');
      expect(httpService.delete).not.toHaveBeenCalled();
    });

    it('should throw ApiError when response has no data', async () => {
      httpService.delete.mockReturnValue(
        of({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await expect(service.removeGuild(validGuildId)).rejects.toThrow(ApiError);
    });
  });

  describe('createGuildMember', () => {
    const mockMemberData = {
      userId: '111111111111111111',
      username: 'testuser',
      nickname: 'TestUser',
      roles: ['123456789012345678'],
    };

    it('should create guild member successfully when API responds successfully', async () => {
      const mockResponse = { id: mockMemberData.userId, created: true };

      httpService.post.mockReturnValue(
        of({
          data: mockResponse,
          status: 201,
          statusText: 'Created',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.createGuildMember(
        '123456789012345678',
        mockMemberData,
      );

      expect(result).toEqual(mockResponse);
      expect(httpService.post).toHaveBeenCalledWith('/internal/guild-members', {
        ...mockMemberData,
        guildId: '123456789012345678',
      });
    });

    it('should throw ApiError when response has no data', async () => {
      httpService.post.mockReturnValue(
        of({
          data: null,
          status: 201,
          statusText: 'Created',
          headers: {},
          config: {} as any,
        }),
      );

      await expect(
        service.createGuildMember('123456789012345678', mockMemberData),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('syncGuildWithMembers', () => {
    const guildId = '123456789012345678';
    const mockGuildData: CreateGuildDto = {
      id: guildId,
      name: 'Test Guild',
      ownerId: '987654321098765432',
      memberCount: 2,
    };
    const mockMembers = [
      {
        userId: '111111111111111111',
        username: 'user1',
        roles: [],
      },
      {
        userId: '222222222222222222',
        username: 'user2',
        nickname: 'User2',
        roles: ['333333333333333333'],
      },
    ];

    it('should sync guild with members successfully', async () => {
      const mockResponse = { synced: true, memberCount: 2 };

      httpService.post.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.syncGuildWithMembers(
        guildId,
        mockGuildData,
        mockMembers,
      );

      expect(result).toEqual(mockResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        `/internal/guilds/${guildId}/sync`,
        {
          guild: mockGuildData,
          members: mockMembers,
          roles: undefined,
        },
      );
    });
  });

  describe('syncGuildWithMembersAndRoles', () => {
    const guildId = '123456789012345678';
    const mockGuildData: CreateGuildDto = {
      id: guildId,
      name: 'Test Guild',
      ownerId: '987654321098765432',
      memberCount: 1,
    };
    const mockMembers = [
      {
        userId: '111111111111111111',
        username: 'user1',
        roles: [],
      },
    ];
    const mockRoles = {
      admin: [
        { id: '444444444444444444', name: 'Admin' },
        { id: '555555555555555555', name: 'Moderator' },
      ],
    };

    it('should sync guild with members and roles successfully', async () => {
      const mockResponse = {
        synced: true,
        memberCount: 1,
        rolesConfigured: true,
      };

      httpService.post.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.syncGuildWithMembersAndRoles(
        guildId,
        mockGuildData,
        mockMembers,
        mockRoles,
      );

      expect(result).toEqual(mockResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        `/internal/guilds/${guildId}/sync`,
        {
          guild: mockGuildData,
          members: mockMembers,
          roles: mockRoles,
        },
      );
    });

    it('should validate Discord ID format before making request', async () => {
      const invalidId = 'invalid';

      await expect(
        service.syncGuildWithMembersAndRoles(
          invalidId,
          mockGuildData,
          mockMembers,
        ),
      ).rejects.toThrow(ApiError);
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should sync without roles when rolesData is undefined', async () => {
      const mockResponse = { synced: true };

      httpService.post.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await service.syncGuildWithMembersAndRoles(
        guildId,
        mockGuildData,
        mockMembers,
      );

      expect(httpService.post).toHaveBeenCalledWith(
        `/internal/guilds/${guildId}/sync`,
        {
          guild: mockGuildData,
          members: mockMembers,
          roles: undefined,
        },
      );
    });

    it('should throw ApiError when response has no data', async () => {
      httpService.post.mockReturnValue(
        of({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await expect(
        service.syncGuildWithMembersAndRoles(
          guildId,
          mockGuildData,
          mockMembers,
          mockRoles,
        ),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('syncGuildMembers', () => {
    const guildId = '123456789012345678';
    const mockMembers = [
      {
        userId: '111111111111111111',
        username: 'user1',
        roles: [],
      },
    ];

    it('should sync guild members successfully', async () => {
      const mockResponse = { synced: true, memberCount: 1 };

      httpService.post.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.syncGuildMembers(guildId, mockMembers);

      expect(result).toEqual(mockResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        `/internal/guild-members/${guildId}/sync`,
        { members: mockMembers },
      );
    });

    it('should validate Discord ID format before making request', async () => {
      const invalidId = 'invalid';

      await expect(
        service.syncGuildMembers(invalidId, mockMembers),
      ).rejects.toThrow(ApiError);
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should throw ApiError when response has no data', async () => {
      httpService.post.mockReturnValue(
        of({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await expect(
        service.syncGuildMembers(guildId, mockMembers),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('updateGuildMember', () => {
    const guildId = '123456789012345678';
    const userId = '111111111111111111';
    const updateData = {
      username: 'updateduser',
      nickname: 'UpdatedUser',
      roles: ['222222222222222222'],
    };

    it('should update guild member successfully', async () => {
      const mockResponse = { updated: true };

      httpService.patch.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.updateGuildMember(
        guildId,
        userId,
        updateData,
      );

      expect(result).toEqual(mockResponse);
      expect(httpService.patch).toHaveBeenCalledWith(
        `/internal/guild-members/${guildId}/users/${userId}`,
        updateData,
      );
    });

    it('should validate both guild ID and user ID formats', async () => {
      await expect(
        service.updateGuildMember('invalid', userId, updateData),
      ).rejects.toThrow(ApiError);

      await expect(
        service.updateGuildMember(guildId, 'invalid', updateData),
      ).rejects.toThrow(ApiError);

      expect(httpService.patch).not.toHaveBeenCalled();
    });

    it('should throw ApiError when response has no data', async () => {
      httpService.patch.mockReturnValue(
        of({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await expect(
        service.updateGuildMember(guildId, userId, updateData),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('removeGuildMember', () => {
    const guildId = '123456789012345678';
    const userId = '111111111111111111';

    it('should remove guild member successfully', async () => {
      const mockResponse = { deleted: true };

      httpService.delete.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.removeGuildMember(guildId, userId);

      expect(result).toEqual(mockResponse);
      expect(httpService.delete).toHaveBeenCalledWith(
        `/internal/guild-members/${guildId}/users/${userId}`,
      );
    });

    it('should validate both guild ID and user ID formats', async () => {
      await expect(
        service.removeGuildMember('invalid', userId),
      ).rejects.toThrow(ApiError);

      await expect(
        service.removeGuildMember(guildId, 'invalid'),
      ).rejects.toThrow(ApiError);

      expect(httpService.delete).not.toHaveBeenCalled();
    });

    it('should throw ApiError when response has no data', async () => {
      httpService.delete.mockReturnValue(
        of({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await expect(service.removeGuildMember(guildId, userId)).rejects.toThrow(
        ApiError,
      );
    });
  });

  describe('getGuildSettings', () => {
    const guildId = '123456789012345678';

    it('should get guild settings successfully', async () => {
      const mockResponse = {
        guildId,
        settings: { notifications: true, language: 'en' },
      };

      httpService.get.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.getGuildSettings(guildId);

      expect(result).toEqual(mockResponse);
      expect(httpService.get).toHaveBeenCalledWith(
        `/internal/guilds/${guildId}/settings`,
      );
    });

    it('should validate Discord ID format before making request', async () => {
      await expect(service.getGuildSettings('invalid')).rejects.toThrow(
        ApiError,
      );
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should throw ApiError when response has no data', async () => {
      httpService.get.mockReturnValue(
        of({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await expect(service.getGuildSettings(guildId)).rejects.toThrow(ApiError);
    });
  });

  describe('registerTrackers', () => {
    const userId = '111111111111111111';
    const urls = ['https://op.gg/summoner/user1', 'https://u.gg/user1'];
    const userData = {
      username: 'testuser',
      globalName: 'Test User',
      avatar: 'avatar_url',
    };

    it('should register trackers successfully with all parameters', async () => {
      const mockResponse = { registered: true, trackerCount: 2 };

      httpService.post.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.registerTrackers(
        userId,
        urls,
        userData,
        'channel123',
        'token123',
      );

      expect(result).toEqual(mockResponse);
      expect(httpService.post).toHaveBeenCalledWith(
        '/internal/trackers/register-multiple',
        {
          userId,
          urls,
          userData,
          channelId: 'channel123',
          interactionToken: 'token123',
        },
      );
    });

    it('should register trackers without optional parameters', async () => {
      const mockResponse = { registered: true };

      httpService.post.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await service.registerTrackers(userId, urls);

      expect(httpService.post).toHaveBeenCalledWith(
        '/internal/trackers/register-multiple',
        {
          userId,
          urls,
          userData: undefined,
          channelId: undefined,
          interactionToken: undefined,
        },
      );
    });

    it('should throw ApiError when response has no data', async () => {
      httpService.post.mockReturnValue(
        of({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await expect(
        service.registerTrackers(userId, urls, userData),
      ).rejects.toThrow(ApiError);
    });
  });

  describe('addTracker', () => {
    const userId = '111111111111111111';
    const url = 'https://op.gg/summoner/user1';

    it('should add tracker successfully with all parameters', async () => {
      const mockResponse = { added: true };

      httpService.post.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      const result = await service.addTracker(
        userId,
        url,
        { username: 'testuser' },
        'channel123',
        'token123',
      );

      expect(result).toEqual(mockResponse);
      expect(httpService.post).toHaveBeenCalledWith('/internal/trackers/add', {
        userId,
        url,
        userData: { username: 'testuser' },
        channelId: 'channel123',
        interactionToken: 'token123',
      });
    });

    it('should add tracker without optional parameters', async () => {
      const mockResponse = { added: true };

      httpService.post.mockReturnValue(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await service.addTracker(userId, url);

      expect(httpService.post).toHaveBeenCalledWith('/internal/trackers/add', {
        userId,
        url,
        userData: undefined,
        channelId: undefined,
        interactionToken: undefined,
      });
    });

    it('should throw ApiError when response has no data', async () => {
      httpService.post.mockReturnValue(
        of({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      await expect(service.addTracker(userId, url)).rejects.toThrow(ApiError);
    });
  });

  describe('error transformation edge cases', () => {
    it('should handle AxiosError with non-object response data', async () => {
      const axiosError = {
        response: {
          status: 500,
          data: 'Simple string error',
        },
        isAxiosError: true,
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.healthCheck()).rejects.toThrow(ApiError);
    });

    it('should handle AxiosError with response.data as null', async () => {
      const axiosError = {
        response: {
          status: 500,
          data: null,
        },
        message: 'Request failed',
        isAxiosError: true,
      } as AxiosError;

      httpService.get.mockReturnValue(throwError(() => axiosError));

      await expect(service.healthCheck()).rejects.toThrow(ApiError);
    });

    it('should handle unknown error types gracefully', async () => {
      httpService.get.mockReturnValue(
        throwError(() => ({ unknown: 'object' })),
      );

      await expect(service.healthCheck()).rejects.toThrow(Error);
    });
  });
});
