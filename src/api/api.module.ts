import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ApiService } from './api.service';
import { ApiHealthService } from './api-health.service';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.getApiBaseUrl(),
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${configService.getApiKey()}`,
          'Content-Type': 'application/json',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ApiService, ApiHealthService],
  exports: [ApiService, ApiHealthService, HttpModule],
})
export class ApiModule {}
