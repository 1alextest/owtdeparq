import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsString, IsNotEmpty, IsUUID, IsInt, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PitchDeck } from './pitch-deck.entity';
import { ChatContext } from './chat-context.entity';

export type SlideType = 
  | 'cover'
  | 'problem'
  | 'solution'
  | 'market'
  | 'product'
  | 'business_model'
  | 'go_to_market'
  | 'competition'
  | 'team'
  | 'financials'
  | 'traction'
  | 'funding_ask';

@Entity('slides')
@Index('idx_slides_deck', ['deckId', 'slideOrder'])
export class Slide {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the slide' })
  id: string;

  @Column({ name: 'deck_id', type: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID of the deck this slide belongs to' })
  deckId: string;

  @Column({ type: 'text' })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Title of the slide' })
  title: string;

  @Column({ type: 'text' })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Main content of the slide' })
  content: string;

  @Column({ name: 'speaker_notes', type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Speaker notes for the slide' })
  speakerNotes: string;

  @Column({ name: 'slide_type', type: 'text' })
  @IsIn([
    'cover', 'problem', 'solution', 'market', 'product', 'business_model',
    'go_to_market', 'competition', 'team', 'financials', 'traction', 'funding_ask'
  ])
  @ApiProperty({ 
    description: 'Type of the slide',
    enum: [
      'cover', 'problem', 'solution', 'market', 'product', 'business_model',
      'go_to_market', 'competition', 'team', 'financials', 'traction', 'funding_ask'
    ]
  })
  slideType: SlideType;

  @Column({ name: 'slide_order', type: 'integer' })
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ description: 'Order of the slide in the deck' })
  slideOrder: number;

  @Column({ name: 'generated_by', type: 'varchar', length: 20, default: 'openai' })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'AI model that generated this slide content', default: 'openai' })
  generatedBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Slide creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Slide last update timestamp' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => PitchDeck, (deck) => deck.slides, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deck_id' })
  @ApiProperty({ type: () => PitchDeck, description: 'Deck this slide belongs to' })
  deck: PitchDeck;

  @OneToMany(() => ChatContext, (chat) => chat.slide)
  @ApiProperty({ type: () => [ChatContext], description: 'Chatbot conversations for this slide' })
  chatContexts: ChatContext[];
}
