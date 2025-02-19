import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, lastValueFrom, map } from 'rxjs';
import { OpenaiService } from '../../openai/openai.service';
import { UserContextService } from '../../user-context/user-context.service';
import { WhatsappUsers } from '../../entities/whatsapp-users.entity';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly url = `https://graph.facebook.com/${process.env.WHATSAPP_CLOUD_API_VERSION}/${process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID}/messages`;
  private readonly config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_ACCESS_TOKEN}`,
    },
  };
  private messageQueue: Map<string, boolean> = new Map();

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly userContextService: UserContextService,
    private readonly httpService: HttpService,
  ) {}

  async processIncomingMessage(phone: string, text: string, messageId: string) {
    if (this.messageQueue.get(messageId)) {
      return;
    }
    this.messageQueue.set(messageId, true);

    try {
      const user = await this.userContextService.findOrCreateUser(phone);
      
      if (!user.isRegistered) {
        await this.handleRegistration(phone, text, messageId, user);
      } else if (text.toLowerCase() === 'menu' || !user.currentState) {
        user.currentState = 'MENU';
        await this.userContextService.updateUser(user);
        await this.sendMainMenu(phone, messageId);
      } else {
        await this.handleUserState(user, phone, text, messageId);
      }
    } catch (error) {
      this.logger.error('Error processing message:', error);
    } finally {
      this.messageQueue.delete(messageId);
    }
  }

  private async handleUserState(user: WhatsappUsers, phone: string, text: string, messageId: string) {
    switch (user.currentState) {
      case 'MENU':
        await this.handleMenuChoice(user, phone, text, messageId);
        break;
      case 'CHAT':
        await this.handleChatState(user, phone, text, messageId);
        break;
      default:
        await this.sendMainMenu(phone, messageId);
    }
  }

  private async handleMenuChoice(user: WhatsappUsers, phone: string, text: string, messageId: string) {
    switch (text.toLowerCase()) {
      case '1':
      case 'faqs':
        await this.sendFAQs(phone, messageId, user.cada);
        break;
      
      case '2':
      case 'chat':
        user.currentState = 'CHAT';
        await this.userContextService.updateUser(user);
        await this.sendMessage(
          phone,
          'Chat mode activated! Type your message or "menu" to return to main menu.',
          messageId
        );
        break;
      
      case '3':
      case 'exit':
        user.currentState = 'END';
        await this.userContextService.updateUser(user);
        await this.sendMessage(
          phone,
          'Thank you for using our service. Have a great day! 👋\nType "menu" when you need me again.',
          messageId
        );
        break;
      
      default:
        await this.sendMainMenu(phone, messageId);
    }
  }

  private async handleChatState(user: WhatsappUsers, phone: string, text: string, messageId: string) {
    if (text.toLowerCase() === 'menu') {
      user.currentState = 'MENU';
      await this.userContextService.updateUser(user);
      await this.sendMainMenu(phone, messageId);
      return;
    }

    const aiResponse = await this.openaiService.generateAIResponse(
      user.id.toString(),
      text
    );
    await this.userContextService.saveLog(user.id, text, aiResponse);
    await this.sendMessage(phone, aiResponse, messageId);
  }

  private async handleRegistration(phone: string, text: string, messageId: string, user: WhatsappUsers) {
    if (!user.registrationStep) {
      user.registrationStep = 'firstName';
      await this.userContextService.updateUser(user);
      await this.sendMessage(phone, 'Welcome! Please provide your first name.', messageId);
      return;
    }
  
    const steps = {
      firstName: {
        next: 'lastName',
        message: 'Thank you! Now, please provide your last name.',
        field: 'firstName'
      },
      lastName: {
        next: 'cada',
        message: 'Great! Now, please select your CADA:\n1. Finance\n2. HR\n3. IT\n4. Operations',
        field: 'lastName'
      },
      cada: {
        next: 'workStation',
        message: 'Almost done! Please provide your work station.',
        field: 'cada'
      },
      workStation: {
        next: 'terms',
        message: 'Finally, please type "accept" to accept our terms of service.',
        field: 'workStation'
      }
    };
  
    const currentStep = steps[user.registrationStep];
    if (currentStep) {
      if (user.registrationStep === 'cada') {
        const cadaOptions = { '1': 'Finance', '2': 'HR', '3': 'IT', '4': 'Operations' };
        user.cada = cadaOptions[text] || text;
      } else {
        user[currentStep.field] = text;
      }
      user.registrationStep = currentStep.next;
      await this.userContextService.updateUser(user);
      await this.sendMessage(phone, currentStep.message, messageId);
      return;
    }
  
    if (user.registrationStep === 'terms' && text.toLowerCase() === 'accept') {
      user.isRegistered = true;
      user.currentState = 'MENU';
      user.registrationStep = 'completed';
      await this.userContextService.updateUser(user);
      await this.sendMessage(
        phone,
        'Registration complete! Welcome to our service.',
        messageId
      );
      await this.sendMainMenu(phone, messageId);
    } else if (user.registrationStep === 'terms') {
      await this.sendMessage(
        phone,
        'Please type "accept" to accept the terms.',
        messageId
      );
    }
  }
  private async sendMainMenu(phone: string, messageId: string) {
    const menu = `Please choose an option:
1. 📚 Get FAQs
2. 💭 Chat with AI
3. 👋 Exit

Reply with the number or option name.`;
    await this.sendMessage(phone, menu, messageId);
  }

  private async sendFAQs(phone: string, messageId: string, cada: string) {
    const faqs = await this.userContextService.getFaqsByCada(cada);
    const faqText = faqs.length > 0
      ? faqs.map((faq, index) => `${index + 1}. Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')
      : 'No FAQs available for your CADA. Please contact support for assistance.';
    
    await this.sendMessage(phone, faqText, messageId);
    await this.sendMessage(phone, '\nType "menu" to return to main menu.', messageId);
  }

  async sendMessage(phone: string, message: string, messageId: string) {
    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      context: { message_id: messageId },
      type: 'text',
      text: { preview_url: false, body: message },
    };

    try {
      const response = await lastValueFrom(
        this.httpService.post(this.url, data, this.config).pipe(
          map((res) => res.data),
          catchError((error) => {
            this.logger.error('Error sending message:', error);
            throw error;
          }),
        ),
      );
      this.logger.log('Message Sent. Status:', response);
      return response;
    } catch (error) {
      this.logger.error('Error sending message:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: string) {
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    try {
      await lastValueFrom(
        this.httpService.post(this.url, data, this.config).pipe(
          map((res) => res.data),
          catchError((error) => {
            this.logger.error('Error marking message as read:', error);
            throw error;
          }),
        ),
      );
    } catch (error) {
      this.logger.error('Error marking message as read:', error);
    }
  }
}