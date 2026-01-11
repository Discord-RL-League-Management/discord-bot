import { Module } from '@nestjs/common';
import { NecordModule } from 'necord';
import { IntentsBitField } from 'discord.js';
import { DiscordService } from './discord.service';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { GuildModule } from '../guild/guild.module';

@Module({
  imports: [
    NecordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.getDiscordToken(),
        intents: [
          IntentsBitField.Flags.Guilds,
          IntentsBitField.Flags.GuildMembers,
          IntentsBitField.Flags.MessageContent,
        ],
      }),
      inject: [ConfigService],
    }),
    GuildModule,
  ],
  providers: [DiscordService],
  exports: [DiscordService],
})
export class DiscordModule {}
