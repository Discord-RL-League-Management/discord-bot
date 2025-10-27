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
});

