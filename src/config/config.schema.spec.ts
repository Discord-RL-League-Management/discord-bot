import { configSchema } from './config.schema';

describe('configSchema', () => {
  describe('valid configurations', () => {
    it('should validate minimal required configuration', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
      };

      const result = configSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.DISCORD_TOKEN).toBe('test-token');
      expect(result.data.BOT_API_KEY).toBe('test-api-key');
      expect(result.data.NODE_ENV).toBe('development');
    });

    it('should validate configuration with API_BASE_URL', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        API_BASE_URL: 'http://localhost:3000',
      };

      const result = configSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.API_BASE_URL).toBe('http://localhost:3000');
    });

    it('should validate configuration with API_HOST, API_PORT, API_PROTOCOL', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        API_HOST: 'localhost',
        API_PORT: '3000',
        API_PROTOCOL: 'http',
      };

      const result = configSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.API_PROTOCOL).toBe('http');
    });

    it('should validate configuration with https protocol', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        API_PROTOCOL: 'https',
      };

      const result = configSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.API_PROTOCOL).toBe('https');
    });

    it('should validate configuration with BOT_PORT', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        BOT_PORT: '3001',
      };

      const result = configSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.BOT_PORT).toBe('3001');
    });

    it('should validate configuration with DASHBOARD_URL', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        DASHBOARD_URL: 'http://localhost:8080',
      };

      const result = configSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.DASHBOARD_URL).toBe('http://localhost:8080');
    });

    it('should validate configuration with empty DASHBOARD_URL', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        DASHBOARD_URL: '',
      };

      const result = configSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.DASHBOARD_URL).toBe('');
    });

    it('should use default NODE_ENV when not provided', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
      };

      const result = configSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.NODE_ENV).toBe('development');
    });

    it('should validate NODE_ENV development', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        NODE_ENV: 'development',
      };

      const result = configSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.NODE_ENV).toBe('development');
    });

    it('should validate NODE_ENV production', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        NODE_ENV: 'production',
      };

      const result = configSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.NODE_ENV).toBe('production');
    });

    it('should validate NODE_ENV test', () => {
      const validConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        NODE_ENV: 'test',
      };

      const result = configSchema.safeParse(validConfig);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.NODE_ENV).toBe('test');
    });
  });

  describe('invalid configurations', () => {
    it('should reject missing DISCORD_TOKEN', () => {
      const invalidConfig = {
        BOT_API_KEY: 'test-api-key',
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      expect('error' in result).toBe(true);
      const errorResult = result as {
        success: false;
        error: { issues: Array<{ path: string[]; message: string }> };
      };
      expect(errorResult.error.issues.length).toBeGreaterThan(0);
      const discordTokenPathErrors = errorResult.error.issues.filter((issue) =>
        issue.path.includes('DISCORD_TOKEN'),
      );
      const discordTokenMessageErrors = errorResult.error.issues.filter(
        (issue) => issue.message.includes('DISCORD_TOKEN'),
      );
      expect(
        discordTokenPathErrors.length + discordTokenMessageErrors.length,
      ).toBeGreaterThan(0);
    });

    it('should reject empty DISCORD_TOKEN', () => {
      const invalidConfig = {
        DISCORD_TOKEN: '',
        BOT_API_KEY: 'test-api-key',
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      expect('error' in result).toBe(true);
      const errorResult = result as {
        success: false;
        error: { issues: Array<{ path: string[] }> };
      };
      const hasDiscordTokenError = errorResult.error.issues.some((issue) =>
        issue.path.includes('DISCORD_TOKEN'),
      );
      expect(hasDiscordTokenError).toBe(true);
    });

    it('should reject missing BOT_API_KEY', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      expect('error' in result).toBe(true);
      const errorResult = result as {
        success: false;
        error: { issues: Array<{ path: string[]; message: string }> };
      };
      const botApiKeyPathErrors = errorResult.error.issues.filter((issue) =>
        issue.path.includes('BOT_API_KEY'),
      );
      const botApiKeyMessageErrors = errorResult.error.issues.filter((issue) =>
        issue.message.includes('BOT_API_KEY'),
      );
      expect(
        botApiKeyPathErrors.length + botApiKeyMessageErrors.length,
      ).toBeGreaterThan(0);
    });

    it('should reject empty BOT_API_KEY', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: '',
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      expect('error' in result).toBe(true);
      const errorResult = result as {
        success: false;
        error: { issues: Array<{ path: string[] }> };
      };
      expect(
        errorResult.error.issues.some((issue) =>
          issue.path.includes('BOT_API_KEY'),
        ),
      ).toBe(true);
    });

    it('should reject invalid API_BASE_URL', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        API_BASE_URL: 'not-a-url',
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      expect('error' in result).toBe(true);
      const errorResult = result as {
        success: false;
        error: { issues: Array<{ path: string[] }> };
      };
      expect(
        errorResult.error.issues.some((issue) =>
          issue.path.includes('API_BASE_URL'),
        ),
      ).toBe(true);
    });

    it('should reject invalid API_PROTOCOL', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        API_PROTOCOL: 'ftp',
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      expect('error' in result).toBe(true);
      const errorResult = result as {
        success: false;
        error: { issues: Array<{ path: string[] }> };
      };
      expect(
        errorResult.error.issues.some((issue) =>
          issue.path.includes('API_PROTOCOL'),
        ),
      ).toBe(true);
    });

    it('should reject invalid NODE_ENV', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        NODE_ENV: 'invalid-env',
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      expect('error' in result).toBe(true);
      const errorResult = result as {
        success: false;
        error: { issues: Array<{ path: string[] }> };
      };
      expect(
        errorResult.error.issues.some((issue) =>
          issue.path.includes('NODE_ENV'),
        ),
      ).toBe(true);
    });

    it('should reject BOT_PORT with non-numeric value', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        BOT_PORT: 'not-a-number',
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      expect('error' in result).toBe(true);
      const errorResult = result as {
        success: false;
        error: { issues: Array<{ path: string[] }> };
      };
      expect(
        errorResult.error.issues.some((issue) =>
          issue.path.includes('BOT_PORT'),
        ),
      ).toBe(true);
    });

    it('should reject BOT_PORT with negative number', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        BOT_PORT: '-1',
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      expect('error' in result).toBe(true);
      const errorResult = result as {
        success: false;
        error: { issues: Array<{ path: string[] }> };
      };
      expect(
        errorResult.error.issues.some((issue) =>
          issue.path.includes('BOT_PORT'),
        ),
      ).toBe(true);
    });

    it('should reject invalid DASHBOARD_URL', () => {
      const invalidConfig = {
        DISCORD_TOKEN: 'test-token',
        BOT_API_KEY: 'test-api-key',
        DASHBOARD_URL: 'not-a-url',
      };

      const result = configSchema.safeParse(invalidConfig);

      expect(result.success).toBe(false);
      expect('error' in result).toBe(true);
      const errorResult = result as {
        success: false;
        error: { issues: Array<{ path: string[] }> };
      };
      expect(
        errorResult.error.issues.some((issue) =>
          issue.path.includes('DASHBOARD_URL'),
        ),
      ).toBe(true);
    });
  });
});
