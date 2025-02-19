import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsAppService: WhatsappService) {}

  @Get('webhook')
  whatsappVerificationChallenge(@Req() request: Request) {
    const mode = request.query['hub.mode'];
    const challenge = request.query['hub.challenge'];
    const token = request.query['hub.verify_token'];
    const verificationToken = process.env.WHATSAPP_CLOUD_API_WEBHOOK_VERIFICATION_TOKEN;

    if (!mode || !token) {
      return 'Error verifying token';
    }

    if (mode === 'subscribe' && token === verificationToken) {
      return challenge?.toString();
    }
  }

  @Post('webhook')
  @HttpCode(200)
  async handleIncomingWhatsappMessage(@Body() request: any) {
    try {
      const entry = request?.entry?.[0]?.changes?.[0]?.value;
      if (!entry?.messages?.[0]) {
        return 'No message to process';
      }

      const message = entry.messages[0];
      const messageSender = message.from;
      const messageID = message.id;

      await this.whatsAppService.markMessageAsRead(messageID);

      if (message.type === 'text') {
        await this.whatsAppService.processIncomingMessage(
          messageSender,
          message.text.body,
          messageID,
        );
      }

      return 'Message processed';
    } catch (error) {
      console.error('Error processing message:', error);
      return 'Error processing message';
    }
  }
}