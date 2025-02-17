import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Logs } from './logs.entity';
import { TrainingData } from './training-data.entity';

@Entity('whatsapp_users')
export class WhatsappUsers {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  user_id: number;

  @Column({ type: 'varchar', length: 15, unique: true })
  phone: string;

  @Column({ name: 'first_name', type: 'varchar', length: 50, nullable: true })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 50, nullable: true })
  lastName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cada: string;

  @Column({
    name: 'work_station',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  workStation: string;

  @Column({ name: 'accepted_terms', type: 'tinyint', default: 0 })
  acceptedTerms: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column({
    name: 'interaction_step',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  interactionStep: string;

  @Column({ name: 'exit_status', type: 'tinyint', default: 0 })
  exitStatus: boolean;

  @Column({ name: 'is_disabled', type: 'tinyint', default: 0 })
  isDisabled: boolean;

  @OneToMany(() => Logs, (log) => log.user)
  logs: Logs[];

  @OneToMany(() => TrainingData, (trainingData) => trainingData.user)
  trainingData: TrainingData[];
}
