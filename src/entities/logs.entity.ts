import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WhatsappUsers } from './whatsapp-users.entity';

@Entity('logs')
export class Logs {
  @PrimaryGeneratedColumn('uuid')  
  id: string;

  @Column({ name: 'userId' })
  userId: string;

  @Column({ name: 'question', type: 'text', nullable: true })
  question: string;

  @Column({ name: 'response', type: 'text', nullable: true })
  response: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => WhatsappUsers, (user) => user.logs)
  @JoinColumn({ name: 'userId' })
  user: WhatsappUsers;
}