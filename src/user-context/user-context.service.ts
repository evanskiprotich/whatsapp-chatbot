import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhatsappUsers } from '../entities/whatsapp-users.entity';
import { Logs } from '../entities/logs.entity';
import { Faqs } from '../entities/faqs.entity';

@Injectable()
export class UserContextService {
  private readonly logger = new Logger(UserContextService.name);

  constructor(
    @InjectRepository(WhatsappUsers)
    private readonly whatsappUsersRepository: Repository<WhatsappUsers>,
    @InjectRepository(Logs)
    private readonly logsRepository: Repository<Logs>,
    @InjectRepository(Faqs)
    private readonly faqsRepository: Repository<Faqs>,
  ) {}

  async findOrCreateUser(phone: string): Promise<WhatsappUsers> {
    let user = await this.whatsappUsersRepository.findOne({ where: { phone } });

    if (!user) {
      user = this.whatsappUsersRepository.create({ phone });
      await this.whatsappUsersRepository.save(user);
    }

    return user;
  }

  async updateUserDetails(
    user: WhatsappUsers,
    firstName: string,
    lastName: string,
    cada: string,
    workStation: string,
    acceptedTerms: boolean,
  ): Promise<WhatsappUsers> {
    user.firstName = firstName;
    user.lastName = lastName;
    user.cada = cada;
    user.workStation = workStation;
    user.acceptedTerms = acceptedTerms;

    return this.whatsappUsersRepository.save(user);
  }

  async updateUser(user: WhatsappUsers): Promise<WhatsappUsers> {
    return this.whatsappUsersRepository.save(user);
  }

  // SAVE USER DURING REGISTRATION TO WHATSAAP_USERS TABLE
  async saveUser(
    phone: string,
    firstName: string,
    lastName: string,
    cada: string,
    workStation: string,
    acceptedTerms: boolean,
  ): Promise<WhatsappUsers> {
    const user = this.whatsappUsersRepository.create({
      phone,
      firstName,
      lastName,
      cada,
      workStation,
      acceptedTerms,
    });
    return this.whatsappUsersRepository.save(user);
  }

  async saveLog(
    userId: string,
    question: string,
    response: string,
  ): Promise<Logs> {
    const log = this.logsRepository.create({ userId, question, response });
    return this.logsRepository.save(log);
  }

  async getFaqs(): Promise<Faqs[]> {
    return this.faqsRepository.find();
  }

  // Get FAQs by cada
  async getFaqsByCada(cada: string): Promise<Faqs[]> {
    return this.faqsRepository.find({ where: { cada } });
  }

  // Save and fetch context from MySQL
  async saveAndFetchContext(
    context: string,
    contextType: 'user' | 'assistant',
    userId: string,
  ): Promise<Array<{ role: string; content: string }>> {
    try {
      const user = await this.whatsappUsersRepository.findOne({
        where: { user_id: userId },
      });

      if (!user) {
        this.logger.error('User not found');
        throw new Error('User not found');
      }

      // Save the new context
      const log = this.logsRepository.create({
        userId: user.user_id,
        question: contextType === 'user' ? context : null,
        response: contextType === 'assistant' ? context : null,
      });
      await this.logsRepository.save(log);

      // Fetch the conversation history
      const logs = await this.logsRepository.find({
        where: { userId: user.user_id },
        order: { createdAt: 'ASC' },
      });

      return logs.map((log) => ({
        role: log.question ? 'user' : 'assistant',
        content: log.question || log.response,
      }));
    } catch (error) {
      this.logger.error('Error saving context and retrieving history', error);
      return [];
    }
  }

  async getConversationHistory(userId: string): Promise<Logs[]> {
    return this.logsRepository.find({ where: { userId } });
  }
}
