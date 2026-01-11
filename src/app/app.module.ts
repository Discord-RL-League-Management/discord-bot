import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { ConfigModule } from '../config/config.module';
import { ApiModule } from '../api/api.module';
import { DiscordModule } from '../discord/discord.module';
import { GuildModule } from '../guild/guild.module';
import { MemberModule } from '../member/member.module';
import { CommandsModule } from '../commands/commands.module';

@Module({
  imports: [
    ConfigModule,
    ApiModule,
    DiscordModule,
    GuildModule,
    MemberModule,
    CommandsModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
