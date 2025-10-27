// Test setup for Discord bot
// Mock environment variables
process.env.API_BASE_URL = 'http://localhost:3000';
process.env.API_KEY = 'test-api-key';
process.env.DISCORD_TOKEN = 'test-discord-token';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};





