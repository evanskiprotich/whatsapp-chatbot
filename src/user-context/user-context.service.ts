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

  async saveLog(userId: number, question: string, response: string): Promise<Logs> {
    const log = this.logsRepository.create({ userId, question, response });
    return this.logsRepository.save(log);
  }

  async getFaqs(): Promise<Faqs[]> {
    return this.faqsRepository.find();
  }

  // get faqs by cada
  async getFaqsByCada(cada: string): Promise<Faqs[]> {
    return this.faqsRepository.find({ where: { cada } });
  }

  async getConversationHistory(userId: number): Promise<Logs[]> {
    return this.logsRepository.find({ where: { userId } });
  }
}