import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;
  let nestConfigService: jest.Mocked<NestConfigService>;
  let module: TestingModule;

  const createMockConfigGetter = (
    configMap: Record<string, any>,
  ): ((key: string) => any) => {
    return (key: string) => configMap[key] ?? undefined;
  };

  beforeEach(async () => {
    const mockNestConfigService = {
      get: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: NestConfigService,
          useValue: mockNestConfigService,
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
    nestConfigService = module.get(NestConfigService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDiscordToken', () => {
    it('should return Discord token when configured', () => {
      const token = 'test-discord-token';
      nestConfigService.get.mockReturnValue(token);

      const result = service.getDiscordToken();

      expect(result).toBe(token);
      expect(nestConfigService.get).toHaveBeenCalledWith('DISCORD_TOKEN', {
        infer: true,
      });
    });

    it('should throw descriptive error when Discord token is missing', () => {
      nestConfigService.get.mockReturnValue(undefined);

      expect(() => service.getDiscordToken()).toThrow(
        'DISCORD_TOKEN is required but was not found in configuration',
      );
    });

    it('should throw error when Discord token is empty string', () => {
      nestConfigService.get.mockReturnValue('');

      expect(() => service.getDiscordToken()).toThrow(
        'DISCORD_TOKEN is required but was not found in configuration',
      );
    });
  });

  describe('getApiBaseUrl', () => {
    it('should return full URL when API_BASE_URL is explicitly set', () => {
      const fullUrl = 'https://api.example.com';
      nestConfigService.get.mockImplementation(
        createMockConfigGetter({ API_BASE_URL: fullUrl }),
      );

      const result = service.getApiBaseUrl();

      expect(result).toBe(fullUrl);
      expect(nestConfigService.get).toHaveBeenCalledWith('API_BASE_URL', {
        infer: true,
      });
    });

    it('should construct URL from components when API_BASE_URL is not set', () => {
      nestConfigService.get.mockImplementation(
        createMockConfigGetter({
          API_PROTOCOL: 'https',
          API_HOST: 'api.example.com',
          API_PORT: '8080',
        }),
      );

      const result = service.getApiBaseUrl();

      expect(result).toBe('https://api.example.com:8080');
    });

    it('should use default protocol http when not specified', () => {
      nestConfigService.get.mockImplementation(
        createMockConfigGetter({
          API_HOST: 'localhost',
          API_PORT: '3000',
        }),
      );

      const result = service.getApiBaseUrl();

      expect(result).toBe('http://localhost:3000');
    });

    it('should use default host localhost when not specified', () => {
      nestConfigService.get.mockImplementation(
        createMockConfigGetter({
          API_PROTOCOL: 'http',
          API_PORT: '3000',
        }),
      );

      const result = service.getApiBaseUrl();

      expect(result).toBe('http://localhost:3000');
    });

    it('should use default port 3000 for http protocol when not specified', () => {
      nestConfigService.get.mockImplementation(
        createMockConfigGetter({
          API_PROTOCOL: 'http',
          API_HOST: 'localhost',
        }),
      );

      const result = service.getApiBaseUrl();

      expect(result).toBe('http://localhost:3000');
    });

    it('should use default port 443 for https protocol when not specified', () => {
      nestConfigService.get.mockImplementation(
        createMockConfigGetter({
          API_PROTOCOL: 'https',
          API_HOST: 'api.example.com',
        }),
      );

      const result = service.getApiBaseUrl();

      expect(result).toBe('https://api.example.com');
    });

    it('should omit port when using standard http port 80', () => {
      nestConfigService.get.mockImplementation(
        createMockConfigGetter({
          API_PROTOCOL: 'http',
          API_HOST: 'api.example.com',
          API_PORT: '80',
        }),
      );

      const result = service.getApiBaseUrl();

      expect(result).toBe('http://api.example.com');
    });

    it('should omit port when using standard https port 443', () => {
      nestConfigService.get.mockImplementation(
        createMockConfigGetter({
          API_PROTOCOL: 'https',
          API_HOST: 'api.example.com',
          API_PORT: '443',
        }),
      );

      const result = service.getApiBaseUrl();

      expect(result).toBe('https://api.example.com');
    });

    it('should include custom port when provided and not standard', () => {
      nestConfigService.get.mockImplementation(
        createMockConfigGetter({
          API_PROTOCOL: 'https',
          API_HOST: 'api.example.com',
          API_PORT: '8443',
        }),
      );

      const result = service.getApiBaseUrl();

      expect(result).toBe('https://api.example.com:8443');
    });

    it('should prefer API_BASE_URL over component-based construction', () => {
      const fullUrl = 'https://override.example.com';
      nestConfigService.get.mockImplementation(
        createMockConfigGetter({
          API_BASE_URL: fullUrl,
          API_PROTOCOL: 'http',
          API_HOST: 'should-not-be-used.com',
        }),
      );

      const result = service.getApiBaseUrl();

      expect(result).toBe(fullUrl);
      expect(nestConfigService.get).toHaveBeenCalledWith('API_BASE_URL', {
        infer: true,
      });
    });
  });

  describe('getApiKey', () => {
    it('should return API key when configured', () => {
      const apiKey = 'test-api-key-12345';
      nestConfigService.get.mockReturnValue(apiKey);

      const result = service.getApiKey();

      expect(result).toBe(apiKey);
      expect(nestConfigService.get).toHaveBeenCalledWith('BOT_API_KEY', {
        infer: true,
      });
    });

    it('should throw descriptive error when API key is missing', () => {
      nestConfigService.get.mockReturnValue(undefined);

      expect(() => service.getApiKey()).toThrow(
        'BOT_API_KEY is required but was not found in configuration',
      );
    });

    it('should throw error when API key is empty string', () => {
      nestConfigService.get.mockReturnValue('');

      expect(() => service.getApiKey()).toThrow(
        'BOT_API_KEY is required but was not found in configuration',
      );
    });
  });

  describe('getDashboardUrl', () => {
    it('should return dashboard URL when configured', () => {
      const dashboardUrl = 'https://dashboard.example.com';
      nestConfigService.get.mockReturnValue(dashboardUrl);

      const result = service.getDashboardUrl();

      expect(result).toBe(dashboardUrl);
      expect(nestConfigService.get).toHaveBeenCalledWith('DASHBOARD_URL', {
        infer: true,
      });
    });

    it('should return undefined when dashboard URL is not configured', () => {
      nestConfigService.get.mockReturnValue(undefined);

      const result = service.getDashboardUrl();

      expect(result).toBeUndefined();
    });

    it('should return undefined when dashboard URL is empty string', () => {
      nestConfigService.get.mockReturnValue('');

      const result = service.getDashboardUrl();

      expect(result).toBeUndefined();
    });
  });

  describe('getNodeEnv', () => {
    it('should return development when NODE_ENV is development', () => {
      nestConfigService.get.mockReturnValue('development');

      const result = service.getNodeEnv();

      expect(result).toBe('development');
      expect(nestConfigService.get).toHaveBeenCalledWith('NODE_ENV', {
        infer: true,
      });
    });

    it('should return production when NODE_ENV is production', () => {
      nestConfigService.get.mockReturnValue('production');

      const result = service.getNodeEnv();

      expect(result).toBe('production');
    });

    it('should return test when NODE_ENV is test', () => {
      nestConfigService.get.mockReturnValue('test');

      const result = service.getNodeEnv();

      expect(result).toBe('test');
    });

    it('should default to development when NODE_ENV is not set', () => {
      nestConfigService.get.mockReturnValue(undefined);

      const result = service.getNodeEnv();

      expect(result).toBe('development');
    });

    it('should default to development when NODE_ENV is null', () => {
      nestConfigService.get.mockReturnValue(null);

      const result = service.getNodeEnv();

      expect(result).toBe('development');
    });
  });

  describe('getBotPort', () => {
    it('should return configured port when valid', () => {
      nestConfigService.get.mockReturnValue('8080');

      const result = service.getBotPort();

      expect(result).toBe(8080);
      expect(nestConfigService.get).toHaveBeenCalledWith('BOT_PORT', {
        infer: true,
      });
    });

    it('should return default port 3001 when BOT_PORT is not set', () => {
      nestConfigService.get.mockReturnValue(undefined);

      const result = service.getBotPort();

      expect(result).toBe(3001);
    });

    it('should return default port 3001 when BOT_PORT is empty string', () => {
      nestConfigService.get.mockReturnValue('');

      const result = service.getBotPort();

      expect(result).toBe(3001);
    });

    it('should return default port 3001 when BOT_PORT is invalid (non-numeric)', () => {
      nestConfigService.get.mockReturnValue('invalid');

      const result = service.getBotPort();

      expect(result).toBe(3001);
    });

    it('should return default port 3001 when BOT_PORT is invalid (NaN)', () => {
      nestConfigService.get.mockReturnValue('not-a-number');

      const result = service.getBotPort();

      expect(result).toBe(3001);
    });

    it('should return default port 3001 when BOT_PORT is 0', () => {
      nestConfigService.get.mockReturnValue('0');

      const result = service.getBotPort();

      expect(result).toBe(3001);
    });

    it('should return default port 3001 when BOT_PORT is negative', () => {
      nestConfigService.get.mockReturnValue('-1');

      const result = service.getBotPort();

      expect(result).toBe(3001);
    });

    it('should return default port 3001 when BOT_PORT exceeds 65535', () => {
      nestConfigService.get.mockReturnValue('65536');

      const result = service.getBotPort();

      expect(result).toBe(3001);
    });

    it('should return valid port when BOT_PORT is at minimum valid value (1)', () => {
      nestConfigService.get.mockReturnValue('1');

      const result = service.getBotPort();

      expect(result).toBe(1);
    });

    it('should return valid port when BOT_PORT is at maximum valid value (65535)', () => {
      nestConfigService.get.mockReturnValue('65535');

      const result = service.getBotPort();

      expect(result).toBe(65535);
    });

    it('should return valid port for common development ports', () => {
      nestConfigService.get.mockReturnValue('3000');

      const result = service.getBotPort();

      expect(result).toBe(3000);
    });

    it('should handle port as numeric string correctly', () => {
      nestConfigService.get.mockReturnValue('9000');

      const result = service.getBotPort();

      expect(result).toBe(9000);
    });
  });
});
