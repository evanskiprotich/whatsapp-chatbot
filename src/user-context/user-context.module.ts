import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserContextService } from './user-context.service';
import { WhatsappUsers } from '../entities/whatsapp-users.entity';
import { Logs } from '../entities/logs.entity';
import { Faqs } from '../entities/faqs.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsappUsers, Logs, Faqs]),
  ],
  providers: [UserContextService],
  exports: [UserContextService],
})
export class UserContextModule {}