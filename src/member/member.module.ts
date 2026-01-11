import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberListeners } from './member.listeners';
import { ApiModule } from '../api/api.module';

@Module({
  imports: [ApiModule],
  providers: [MemberService, MemberListeners],
  exports: [MemberService],
})
export class MemberModule {}
