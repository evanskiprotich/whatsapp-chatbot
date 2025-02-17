import { Module } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { UserContextService } from 'src/user-context/user-context.service';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappUsers } from 'src/entities/whatsapp-users.entity';
import { Logs } from 'src/entities/logs.entity';
import { Faqs } from 'src/entities/faqs.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsappUsers, Logs, Faqs]),
  ],
  providers: [UserContextService],
  exports: [UserContextService],
})
export class OpenaiModule {}
