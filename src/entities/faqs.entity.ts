import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Faqs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  question: string;

  @Column('text')
  answer: string;

  @Column()
  cada: string;
}