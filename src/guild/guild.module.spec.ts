import { Test, TestingModule } from '@nestjs/testing';
import { GuildModule } from './guild.module';

describe('GuildModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Set minimal environment variables for module compilation
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      DISCORD_TOKEN: 'test-token',
      BOT_API_KEY: 'test-api-key',
    };

    try {
      module = await Test.createTestingModule({
        imports: [GuildModule],
      }).compile();

      expect(module).toBeDefined();
    } finally {
      process.env = originalEnv;
    }
  });

  afterEach(async () => {
    await module?.close();
  });

  it('should compile successfully', () => {
    expect(module).toBeDefined();
  });
});
