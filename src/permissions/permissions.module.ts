import { Module } from '@nestjs/common';
import { ApiModule } from '../api/api.module';
import { ConfigModule } from '../config/config.module';
import { PermissionValidatorService } from './permission-validator/permission-validator.service';
import { PermissionLoggerService } from './permission-logger/permission-logger.service';
import { PermissionGuard } from './permission/permission.guard';

@Module({
  imports: [ApiModule, ConfigModule],
  providers: [
    PermissionValidatorService,
    PermissionLoggerService,
    PermissionGuard,
  ],
  exports: [
    PermissionGuard,
    PermissionValidatorService,
    PermissionLoggerService,
  ],
})
export class PermissionsModule {}
