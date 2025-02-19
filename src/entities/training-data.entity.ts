import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WhatsappUsers } from './whatsapp-users.entity';

@Entity('training_data')
export class TrainingData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({ name: 'id', type: 'bigint', nullable: true })
  userId: number;

  @Column({ type: 'tinyint', default: 0 })
  trained: boolean;

  @ManyToOne(() => WhatsappUsers, (user) => user.trainingData)
  @JoinColumn({ name: 'id' })
  user: WhatsappUsers;
}
