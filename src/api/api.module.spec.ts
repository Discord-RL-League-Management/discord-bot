import { Test, TestingModule } from '@nestjs/testing';
import { ApiModule } from './api.module';
import { ApiService } from './api.service';
import { ApiHealthService } from './api-health.service';
import { ApiHealthGuard } from './api-health.guard';
import { HttpModule } from '@nestjs/axios';

describe('ApiModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Set minimal environment variables for module compilation
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      DISCORD_TOKEN: 'test-token',
      BOT_API_KEY: 'test-api-key',
      API_BASE_URL: 'http://localhost:3000',
    };

    try {
      module = await Test.createTestingModule({
        imports: [ApiModule],
      }).compile();
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

  it('should resolve ApiService via DI', () => {
    const service = module.get<ApiService>(ApiService);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(ApiService);
  });

  it('should resolve ApiHealthService via DI', () => {
    const service = module.get<ApiHealthService>(ApiHealthService);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(ApiHealthService);
  });

  it('should resolve ApiHealthGuard via DI', () => {
    const guard = module.get<ApiHealthGuard>(ApiHealthGuard);

    expect(guard).toBeDefined();
    expect(guard).toBeInstanceOf(ApiHealthGuard);
  });

  it('should export HttpModule', () => {
    const httpModule = module.get(HttpModule);

    expect(httpModule).toBeDefined();
  });
});
