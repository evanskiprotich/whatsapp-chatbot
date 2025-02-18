import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { WhatsappService } from './whatsapp.service';
import { StabilityaiService } from 'src/stabilityai/stabilityai.service';
import { UserContextService } from 'src/user-context/user-context.service';
import { OpenaiService } from '../../openai/openai.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsAppService: WhatsappService,
    private readonly stabilityaiService: StabilityaiService,
    private readonly userContextService: UserContextService,
    private readonly openaiService: OpenaiService,
  ) {}

  @Get('webhook')
  whatsappVerificationChallenge(@Req() request: Request) {
    const mode = request.query['hub.mode'];
    const challenge = request.query['hub.challenge'];
    const token = request.query['hub.verify_token'];

    const verificationToken =
      process.env.WHATSAPP_CLOUD_API_WEBHOOK_VERIFICATION_TOKEN;

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
    const { messages } = request?.entry?.[0]?.changes?.[0].value ?? {};
    if (!messages) return;

    const message = messages[0];
    const messageSender = message.from;
    const messageID = message.id;

    await this.whatsAppService.markMessageAsRead(messageID);

    let user = await this.userContextService.findOrCreateUser(messageSender);

    // Handle registration if user details are incomplete
    if (
      !user.firstName ||
      !user.lastName ||
      !user.cada ||
      !user.workStation ||
      !user.acceptedTerms
    ) {
      await this.whatsAppService.handleRegistration(messageSender, messageID);
      return; // Exit early to avoid logging registration messages
    }

    // Handle AI interaction
    switch (message.type) {
      case 'text':
        const text = message.text.body;

        // Handle AI interaction
        const aiResponse = await this.openaiService.generateAIResponse(
          user.user_id.toString(),
          text,
        );

        // Save the log only for AI interactions
        await this.userContextService.saveLog(user.user_id, text, aiResponse);

        await this.whatsAppService.sendWhatsAppMessage(
          messageSender,
          aiResponse,
          messageID,
        );
        break;
    }

    return 'Message processed';
  }

  @Get('faqs')
  async getFaqs() {
    return this.userContextService.getFaqs();
  }
}
