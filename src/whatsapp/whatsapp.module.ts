import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp/whatsapp.controller';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { OpenaiService } from 'src/openai/openai.service';
import { UserContextService } from '../user-context/user-context.service';
import { StabilityaiService } from '../stabilityai/stabilityai.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappUsers } from 'src/entities/whatsapp-users.entity';
import { Logs } from 'src/entities/logs.entity';
import { Faqs } from 'src/entities/faqs.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WhatsappUsers, Logs, Faqs]), 
  ],
  controllers: [WhatsappController],
  providers: [
    OpenaiService,
    WhatsappService,
    UserContextService,
    StabilityaiService,
  ],
  exports: [UserContextService],
})
export class WhatsappModule {}
