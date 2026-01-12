import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsModule } from './permissions.module';
import { PermissionGuard } from './permission/permission.guard';
import { StaffOnlyGuard } from './staff-only/staff-only.guard';
import { TestCommandGuard } from './test-command/test-command.guard';
import { PermissionValidatorService } from './permission-validator/permission-validator.service';
import { PermissionLoggerService } from './permission-logger/permission-logger.service';

describe('PermissionsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      DISCORD_TOKEN: 'test-token',
      BOT_API_KEY: 'test-api-key',
    };

    try {
      module = await Test.createTestingModule({
        imports: [PermissionsModule],
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

  it('should resolve PermissionGuard via DI', () => {
    const guard = module.get<PermissionGuard>(PermissionGuard);

    expect(guard).toBeDefined();
    expect(guard).toBeInstanceOf(PermissionGuard);
  });

  it('should resolve StaffOnlyGuard via DI', () => {
    const guard = module.get<StaffOnlyGuard>(StaffOnlyGuard);

    expect(guard).toBeDefined();
    expect(guard).toBeInstanceOf(StaffOnlyGuard);
  });

  it('should resolve TestCommandGuard via DI', () => {
    const guard = module.get<TestCommandGuard>(TestCommandGuard);

    expect(guard).toBeDefined();
    expect(guard).toBeInstanceOf(TestCommandGuard);
  });

  it('should resolve PermissionValidatorService via DI', () => {
    const service = module.get<PermissionValidatorService>(
      PermissionValidatorService,
    );

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(PermissionValidatorService);
  });

  it('should resolve PermissionLoggerService via DI', () => {
    const service = module.get<PermissionLoggerService>(
      PermissionLoggerService,
    );

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(PermissionLoggerService);
  });

  it('should export PermissionGuard', () => {
    const guard = module.get<PermissionGuard>(PermissionGuard);
    expect(guard).toBeDefined();
  });

  it('should export PermissionValidatorService', () => {
    const service = module.get<PermissionValidatorService>(
      PermissionValidatorService,
    );
    expect(service).toBeDefined();
  });

  it('should export PermissionLoggerService', () => {
    const service = module.get<PermissionLoggerService>(
      PermissionLoggerService,
    );
    expect(service).toBeDefined();
  });

  it('should export StaffOnlyGuard', () => {
    const guard = module.get<StaffOnlyGuard>(StaffOnlyGuard);
    expect(guard).toBeDefined();
  });

  it('should export TestCommandGuard', () => {
    const guard = module.get<TestCommandGuard>(TestCommandGuard);
    expect(guard).toBeDefined();
  });
});
