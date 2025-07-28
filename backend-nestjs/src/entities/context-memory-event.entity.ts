import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { IsString, IsNotEmpty, IsUUID, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from './project.entity';
import { PitchDeck } from './pitch-deck.entity';

export type EventType = 'user_input' | 'ai_generation' | 'user_edit' | 'feedback' | 'chatbot_interaction';
export type LearningScope = 'deck' | 'project' | 'global';

@Entity('project_context_memory')
@Index('idx_context_memory_project', ['projectId', 'createdAt'])
@Index('idx_context_memory_deck', ['deckId', 'createdAt'])
@Check(`event_type IN ('user_input', 'ai_generation', 'user_edit', 'feedback', 'chatbot_interaction')`)
@Check(`learning_scope IN ('deck', 'project', 'global')`)
export class ContextMemoryEvent {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the context memory event' })
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID of the project this event belongs to' })
  projectId: string;

  @Column({ name: 'deck_id', type: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID of the deck this event belongs to' })
  deckId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  @IsIn(['user_input', 'ai_generation', 'user_edit', 'feedback', 'chatbot_interaction'])
  @ApiProperty({ 
    description: 'Type of event recorded',
    enum: ['user_input', 'ai_generation', 'user_edit', 'feedback', 'chatbot_interaction']
  })
  eventType: EventType;

  @Column({ type: 'jsonb' })
  @IsNotEmpty()
  @ApiProperty({ description: 'Event content and data' })
  content: any;

  @Column({ name: 'learning_scope', type: 'varchar', length: 20, default: 'deck' })
  @IsIn(['deck', 'project', 'global'])
  @ApiProperty({ 
    description: 'Scope of learning for this event',
    enum: ['deck', 'project', 'global'],
    default: 'deck'
  })
  learningScope: LearningScope;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Event creation timestamp' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Project, (project) => project.contextEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  @ApiProperty({ type: () => Project, description: 'Project this event belongs to' })
  project: Project;

  @ManyToOne(() => PitchDeck, (deck) => deck.contextEvents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deck_id' })
  @ApiProperty({ type: () => PitchDeck, description: 'Deck this event belongs to' })
  deck: PitchDeck;
}
