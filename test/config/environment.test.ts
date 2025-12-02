import { loadEnvironmentConfig } from '../../src/config/environment';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load valid environment configuration', () => {
    process.env = {
      DISCORD_TOKEN: 'test-token',
      API_BASE_URL: 'http://localhost:3000',
      API_KEY: 'test-key',
    };

    const config = loadEnvironmentConfig();

    expect(config.DISCORD_TOKEN).toBe('test-token');
    expect(config.API_BASE_URL).toBe('http://localhost:3000');
    expect(config.API_KEY).toBe('test-key');
  });

  it('should throw error on missing DISCORD_TOKEN', () => {
    process.env = {
      API_BASE_URL: 'http://localhost:3000',
      API_KEY: 'test-key',
    };

    expect(() => loadEnvironmentConfig()).toThrow();
  });

  it('should throw error on invalid API_BASE_URL', () => {
    process.env = {
      DISCORD_TOKEN: 'test-token',
      API_BASE_URL: 'not-a-url',
      API_KEY: 'test-key',
    };

    expect(() => loadEnvironmentConfig()).toThrow();
  });

  it('should throw error on missing API_KEY', () => {
    process.env = {
      DISCORD_TOKEN: 'test-token',
      API_BASE_URL: 'http://localhost:3000',
    };

    expect(() => loadEnvironmentConfig()).toThrow();
  });

  it('should load valid ALLOWED_USER_ID', () => {
    process.env = {
      DISCORD_TOKEN: 'test-token',
      API_BASE_URL: 'http://localhost:3000',
      API_KEY: 'test-key',
      ALLOWED_USER_ID: '354474826192388127',
    };

    const config = loadEnvironmentConfig();

    expect(config.ALLOWED_USER_ID).toBe('354474826192388127');
  });

  it('should allow ALLOWED_USER_ID to be undefined when not set', () => {
    process.env = {
      DISCORD_TOKEN: 'test-token',
      API_BASE_URL: 'http://localhost:3000',
      API_KEY: 'test-key',
    };

    const config = loadEnvironmentConfig();

    expect(config.ALLOWED_USER_ID).toBeUndefined();
  });

  it('should throw error on invalid ALLOWED_USER_ID format (too short)', () => {
    process.env = {
      DISCORD_TOKEN: 'test-token',
      API_BASE_URL: 'http://localhost:3000',
      API_KEY: 'test-key',
      ALLOWED_USER_ID: '1234567890123456', // 16 digits
    };

    expect(() => loadEnvironmentConfig()).toThrow();
  });

  it('should throw error on invalid ALLOWED_USER_ID format (non-numeric)', () => {
    process.env = {
      DISCORD_TOKEN: 'test-token',
      API_BASE_URL: 'http://localhost:3000',
      API_KEY: 'test-key',
      ALLOWED_USER_ID: 'abc123456789012345',
    };

    expect(() => loadEnvironmentConfig()).toThrow();
  });

  it('should accept valid Discord snowflake (17 digits)', () => {
    process.env = {
      DISCORD_TOKEN: 'test-token',
      API_BASE_URL: 'http://localhost:3000',
      API_KEY: 'test-key',
      ALLOWED_USER_ID: '12345678901234567', // 17 digits
    };

    const config = loadEnvironmentConfig();

    expect(config.ALLOWED_USER_ID).toBe('12345678901234567');
  });

  it('should accept valid Discord snowflake (19 digits)', () => {
    process.env = {
      DISCORD_TOKEN: 'test-token',
      API_BASE_URL: 'http://localhost:3000',
      API_KEY: 'test-key',
      ALLOWED_USER_ID: '1234567890123456789', // 19 digits
    };

    const config = loadEnvironmentConfig();

    expect(config.ALLOWED_USER_ID).toBe('1234567890123456789');
  });
});

