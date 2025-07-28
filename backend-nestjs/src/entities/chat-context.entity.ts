import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PitchDeck } from './pitch-deck.entity';
import { Slide } from './slide.entity';

@Entity('chatbot_conversations')
@Index('idx_chatbot_conversations_user', ['userId', 'createdAt'])
@Index('idx_chatbot_conversations_deck', ['deckId', 'createdAt'])
export class ChatContext {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the chat conversation' })
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Firebase UID of the user' })
  userId: string;

  @Column({ name: 'deck_id', type: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID of the deck this conversation is about' })
  deckId: string;

  @Column({ name: 'slide_id', type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  @ApiProperty({ description: 'ID of the specific slide being discussed (optional)' })
  slideId: string;

  @Column({ name: 'conversation_data', type: 'jsonb' })
  @IsNotEmpty()
  @ApiProperty({ description: 'Array of messages with timestamps and metadata' })
  conversationData: any;

  @Column({ name: 'context_used', type: 'jsonb', nullable: true })
  @IsOptional()
  @ApiProperty({ description: 'Context that was provided to AI for this conversation' })
  contextUsed: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Conversation creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Conversation last update timestamp' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => PitchDeck, (deck) => deck.chatContexts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deck_id' })
  @ApiProperty({ type: () => PitchDeck, description: 'Deck this conversation is about' })
  deck: PitchDeck;

  @ManyToOne(() => Slide, (slide) => slide.chatContexts, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'slide_id' })
  @ApiProperty({ type: () => Slide, description: 'Specific slide being discussed (optional)' })
  slide: Slide;
}
