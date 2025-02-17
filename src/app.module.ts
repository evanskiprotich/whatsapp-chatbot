import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { OpenaiModule } from './openai/openai.module';
import { UserContextModule } from './user-context/user-context.module';
import { StabilityaiModule } from './stabilityai/stabilityai.module';
import { WhatsappUsers } from './entities/whatsapp-users.entity';
import { Logs } from './entities/logs.entity';
import { TrainingData } from './entities/training-data.entity';
import { Faqs } from './entities/faqs.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'Dev@3121',
      database: process.env.DB_NAME || 'chatbot',
      entities: [WhatsappUsers, Logs, TrainingData, Faqs],
      synchronize: true, // Set to false in production
    }),
    WhatsappModule,
    OpenaiModule,
    UserContextModule,
    StabilityaiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}