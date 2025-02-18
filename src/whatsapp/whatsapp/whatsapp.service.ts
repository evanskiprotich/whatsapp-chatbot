import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { catchError, lastValueFrom, map } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { OpenaiService } from 'src/openai/openai.service';
import { UserContextService } from 'src/user-context/user-context.service';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly openaiService: OpenaiService,
    private readonly userContextService: UserContextService,
  ) {}

  private readonly httpService = new HttpService();
  private readonly logger = new Logger(WhatsappService.name);
  private readonly url = `https://graph.facebook.com/${process.env.WHATSAPP_CLOUD_API_VERSION}/${process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID}/messages`;
  private readonly config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_ACCESS_TOKEN}`,
    },
  };

  async sendWhatsAppMessage(
    messageSender: string,
    userInput: string,
    messageID: string,
  ) {
    const aiResponse = await this.openaiService.generateAIResponse(
      messageSender,
      userInput,
    );

    const data = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: messageSender,
      context: {
        message_id: messageID,
      },
      type: 'text',
      text: {
        preview_url: false,
        body: aiResponse,
      },
    });

    try {
      const response = this.httpService
        .post(this.url, data, this.config)
        .pipe(
          map((res) => {
            return res.data;
          }),
        )
        .pipe(
          catchError((error) => {
            this.logger.error(error);
            throw new BadRequestException(
              'Error Posting To WhatsApp Cloud API',
            );
          }),
        );

      const messageSendingStatus = await lastValueFrom(response);
      this.logger.log('Message Sent. Status:', messageSendingStatus);

      // Save the log
      const user =
        await this.userContextService.findOrCreateUser(messageSender);
      await this.userContextService.saveLog(
        user.user_id,
        userInput,
        aiResponse,
      );
    } catch (error) {
      this.logger.error(error);
      return 'Axle broke!! Abort mission!!';
    }
  }

  async sendImageByUrl(
    messageSender: string,
    fileName: string,
    messageID: string,
  ) {
    const imageUrl = `${process.env.SERVER_URL}/${fileName}`;
    const data = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: messageSender,
      context: {
        message_id: messageID,
      },
      type: 'image',
      image: {
        link: imageUrl,
      },
    });

    try {
      const response = this.httpService
        .post(this.url, data, this.config)
        .pipe(
          map((res) => {
            return res.data;
          }),
        )
        .pipe(
          catchError((error) => {
            this.logger.error(error);
            throw new BadRequestException(
              'Error Posting To WhatsApp Cloud API',
            );
          }),
        );

      const messageSendingStatus = await lastValueFrom(response);

      return `Image sent successfully, response: ${messageSendingStatus}`;
    } catch (error) {
      this.logger.error(error);
      return 'Axle broke!! Error Sending Image!!';
    }
  }

  async markMessageAsRead(messageID: string) {
    const data = JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageID,
    });

    try {
      const response = this.httpService
        .post(this.url, data, this.config)
        .pipe(
          map((res) => {
            return res.data;
          }),
        )
        .pipe(
          catchError((error) => {
            this.logger.error(error);
            throw new BadRequestException('Error Marking Message As Read');
          }),
        );

      const messageStatus = await lastValueFrom(response);
      this.logger.log('Message Marked As Read. Status:', messageStatus);
    } catch (error) {
      this.logger.error(error);
      return 'Axle broke!! Abort mission!!';
    }
  }

  async handleRegistration(messageSender: string, messageID: string) {
    let user = await this.userContextService.findOrCreateUser(messageSender);

    if (!user.firstName) {
      await this.sendWhatsAppMessage(
        messageSender,
        'Welcome! Please provide your first name.',
        messageID,
      );
      user.interactionStep = 'firstName';
      await this.userContextService.updateUser(user);
      return;
    }

    if (!user.lastName) {
      await this.sendWhatsAppMessage(
        messageSender,
        'Thank you! Now, please provide your last name.',
        messageID,
      );
      user.interactionStep = 'lastName';
      await this.userContextService.updateUser(user);
      return;
    }

    if (!user.cada) {
      await this.sendWhatsAppMessage(
        messageSender,
        'Great! Now, please provide your CADA.',
        messageID,
      );
      user.interactionStep = 'cada';
      await this.userContextService.updateUser(user);
      return;
    }

    if (!user.workStation) {
      await this.sendWhatsAppMessage(
        messageSender,
        'Almost done! Please provide your work station.',
        messageID,
      );
      user.interactionStep = 'workStation';
      await this.userContextService.updateUser(user);
      return;
    }

    if (!user.acceptedTerms) {
      await this.sendWhatsAppMessage(
        messageSender,
        'Finally, please accept our terms by typing "accept".',
        messageID,
      );
      user.interactionStep = 'acceptTerms';
      await this.userContextService.updateUser(user);
      return;
    }

    // Save the user details after registration is complete
    await this.userContextService.saveUser(
      user.phone,
      user.firstName,
      user.lastName,
      user.cada,
      user.workStation,
      user.acceptedTerms,
    );

    await this.sendWhatsAppMessage(
      messageSender,
      'Thank you for completing the registration! How can I assist you today?',
      messageID,
    );
  }

  async sendEnhancedMainMenu(messageSender: string, messageID: string) {
    const menu = `Please choose an option:
    1. Get FAQs
    2. Chat with AI
    3. Exit`;

    await this.sendWhatsAppMessage(messageSender, menu, messageID);
  }

  async sendFAQs(messageSender: string, messageID: string) {
    const faqs = await this.userContextService.getFaqs();
    const faqText = faqs
      .map((faq) => `${faq.question}\n${faq.answer}`)
      .join('\n\n');

    await this.sendWhatsAppMessage(messageSender, faqText, messageID);
  }
}
