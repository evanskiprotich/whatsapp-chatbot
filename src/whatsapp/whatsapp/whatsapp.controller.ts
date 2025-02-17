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

    if (!user.firstName) {
      await this.whatsAppService.handleRegistration(messageSender, messageID);
      return;
    }

    if (!user.acceptedTerms) {
      await this.whatsAppService.sendWhatsAppMessage(
        messageSender,
        'Please accept our terms by typing "accept" to continue.',
        messageID,
      );
      return;
    }

    switch (message.type) {
      case 'text':
        const text = message.text.body;

        if (text.toLowerCase().includes('/imagine')) {
          const response = await this.stabilityaiService.textToImage(
            text.replace('/imagine', ''),
          );

          if (Array.isArray(response)) {
            await this.whatsAppService.sendImageByUrl(
              messageSender,
              response[0],
              messageID,
            );
          }
          return;
        }

        if (text.toLowerCase().includes('accept')) {
          user = await this.userContextService.updateUserDetails(
            user,
            user.firstName,
            user.lastName,
            user.cada,
            user.workStation,
            true,
          );
          await this.whatsAppService.sendWhatsAppMessage(
            messageSender,
            'Thank you for accepting our terms! How can I assist you today?',
            messageID,
          );
          return;
        }

        if (text.toLowerCase().includes('menu')) {
          await this.whatsAppService.sendEnhancedMainMenu(messageSender, messageID);
          return;
        }

        if (text.toLowerCase().includes('faqs')) {
          const faqs = await this.userContextService.getFaqsByCada(user.cada);
          const faqText = faqs.map(faq => `${faq.question}\n${faq.answer}`).join('\n\n');
          await this.whatsAppService.sendWhatsAppMessage(
            messageSender,
            faqText,
            messageID,
          );
          return;
        }

        const aiResponse = await this.openaiService.generateAIResponse(user.user_id.toString(), text);

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