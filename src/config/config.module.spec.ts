import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from './config.module';
import { validate } from './config.module';

describe('ConfigModule', () => {
  let module: TestingModule;

  afterEach(async () => {
    await module?.close();
  });

  it('should compile successfully', async () => {
    // Mock environment variables for module compilation
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      DISCORD_TOKEN: 'test-token',
      BOT_API_KEY: 'test-api-key',
    };

    try {
      module = await Test.createTestingModule({
        imports: [ConfigModule],
      }).compile();

      expect(module).toBeDefined();
    } finally {
      process.env = originalEnv;
    }
  });

  describe('validate function', () => {
    it('should validate valid configuration', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        API_BASE_URL: 'http://localhost:3000',
        BOT_PORT: '3001',
        NODE_ENV: 'development',
      };

      const result = validate(validConfig);

      expect(result).toBeDefined();
      expect(result.DISCORD_TOKEN).toBe('test-token');
      expect(result.BOT_API_KEY).toBe('test-api-key');
    });

    it('should accept valid configuration with API_HOST, API_PORT, API_PROTOCOL', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        API_HOST: 'localhost',
        API_PORT: '3000',
        API_PROTOCOL: 'http',
      };

      const result = validate(validConfig);

      expect(result).toBeDefined();
      expect(result.API_PROTOCOL).toBe('http');
    });

    it('should accept valid configuration with DASHBOARD_URL', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        DASHBOARD_URL: 'http://localhost:8080',
      };

      const result = validate(validConfig);

      expect(result).toBeDefined();
      expect(result.DASHBOARD_URL).toBe('http://localhost:8080');
    });

    it('should accept empty DASHBOARD_URL', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        DASHBOARD_URL: '',
      };

      const result = validate(validConfig);

      expect(result).toBeDefined();
      expect(result.DASHBOARD_URL).toBe('');
    });

    it('should use default NODE_ENV when not provided', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
      };

      const result = validate(validConfig);

      expect(result).toBeDefined();
      expect(result.NODE_ENV).toBe('development');
    });

    it('should throw error when DISCORD_TOKEN is missing', () => {
      const invalidConfig = {
        BOT_API_KEY: 'test-api-key',
      };

      expect(() => validate(invalidConfig)).toThrow(
        'Invalid environment configuration',
      );
    });

    it('should throw error when DISCORD_TOKEN is empty', () => {
      const invalidConfig = {
        DISCORD_TOKEN: '',
        BOT_API_KEY: 'test-api-key',
      };

      expect(() => validate(invalidConfig)).toThrow(
        'Invalid environment configuration',
      );
    });

    it('should throw error when BOT_API_KEY is missing', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
      };

      expect(() => validate(invalidConfig)).toThrow(
        'Invalid environment configuration',
      );
    });

    it('should throw error when BOT_API_KEY is empty', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: '',
      };

      expect(() => validate(invalidConfig)).toThrow(
        'Invalid environment configuration',
      );
    });

    it('should throw error with formatted error messages', () => {
      const invalidConfig = {
        DISCORD_TOKEN: '',
        BOT_API_KEY: '',
      };

      try {
        validate(invalidConfig);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('Invalid environment configuration');
        expect(errorMessage).toContain('DISCORD_TOKEN');
        expect(errorMessage).toContain('BOT_API_KEY');
      }
    });

    it('should throw error when API_BASE_URL is invalid URL', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        API_BASE_URL: 'not-a-url',
      };

      expect(() => validate(invalidConfig)).toThrow(
        'Invalid environment configuration',
      );
    });

    it('should throw error when API_PROTOCOL is invalid', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        API_PROTOCOL: 'ftp',
      };

      expect(() => validate(invalidConfig)).toThrow(
        'Invalid environment configuration',
      );
    });

    it('should throw error when NODE_ENV is invalid', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        NODE_ENV: 'invalid-env',
      };

      expect(() => validate(invalidConfig)).toThrow(
        'Invalid environment configuration',
      );
    });

    it('should throw error when BOT_PORT is not a valid number', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        BOT_PORT: 'not-a-number',
      };

      expect(() => validate(invalidConfig)).toThrow(
        'Invalid environment configuration',
      );
    });

    it('should throw error when DASHBOARD_URL is invalid URL', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        DASHBOARD_URL: 'not-a-url',
      };

      expect(() => validate(invalidConfig)).toThrow(
        'Invalid environment configuration',
      );
    });
  });
});
