import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';

describe('AppModule', () => {
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
        imports: [AppModule],
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

  it('should resolve AppController via DI', () => {
    const controller = module.get<AppController>(AppController);

    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(AppController);
  });

  it('should resolve AppService via DI', () => {
    const service = module.get<AppService>(AppService);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(AppService);
  });

  it('should inject AppService into AppController', () => {
    const controller = module.get<AppController>(AppController);

    expect(controller).toBeDefined();
  });
});
