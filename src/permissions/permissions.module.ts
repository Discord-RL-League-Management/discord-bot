import { Module } from '@nestjs/common';
import { ApiModule } from '../api/api.module';
import { ConfigModule } from '../config/config.module';
import { PermissionValidatorService } from './permission-validator/permission-validator.service';
import { PermissionLoggerService } from './permission-logger/permission-logger.service';
import { PermissionGuard } from './permission/permission.guard';
import { StaffOnlyGuard } from './staff-only/staff-only.guard';
import { TestCommandGuard } from './test-command/test-command.guard';
import { E2ERestrictionGuard } from './e2e-restriction/e2e-restriction.guard';

@Module({
  imports: [ApiModule, ConfigModule],
  providers: [
    PermissionValidatorService,
    PermissionLoggerService,
    PermissionGuard,
    StaffOnlyGuard,
    TestCommandGuard,
    E2ERestrictionGuard,
  ],
  exports: [
    PermissionGuard,
    PermissionValidatorService,
    PermissionLoggerService,
    StaffOnlyGuard,
    TestCommandGuard,
    E2ERestrictionGuard,
  ],
})
export class PermissionsModule {}
