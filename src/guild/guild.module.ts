import { Module } from '@nestjs/common';
import { GuildService } from './guild.service';
import { GuildSyncService } from './guild-sync.service';
import { GuildListeners } from './guild.listeners';
import { ApiModule } from '../api/api.module';

@Module({
  imports: [ApiModule],
  providers: [GuildService, GuildSyncService, GuildListeners],
  exports: [GuildService, GuildSyncService],
})
export class GuildModule {}
