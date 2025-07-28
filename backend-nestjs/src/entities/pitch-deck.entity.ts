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
  Check,
} from 'typeorm';
import { IsString, IsNotEmpty, IsUUID, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from './project.entity';
import { Slide } from './slide.entity';
import { DeckVersion } from './deck-version.entity';
import { ContextMemoryEvent } from './context-memory-event.entity';
import { ChatContext } from './chat-context.entity';

export type DeckMode = 'free' | 'custom';

@Entity('pitch_decks')
@Index('idx_pitch_decks_project', ['projectId'])
@Check(`mode IN ('free', 'custom')`)
export class PitchDeck {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the pitch deck' })
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID of the project this deck belongs to' })
  projectId: string;

  @Column({ type: 'text' })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Title of the pitch deck' })
  title: string;

  @Column({ type: 'text' })
  @IsIn(['free', 'custom'])
  @ApiProperty({ description: 'Generation mode used for this deck', enum: ['free', 'custom'] })
  mode: DeckMode;

  @Column({ name: 'generation_data', type: 'jsonb', nullable: true })
  @IsOptional()
  @ApiProperty({ description: 'Original prompt or form data used for generation' })
  generationData: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Deck creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Deck last update timestamp' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Project, (project) => project.decks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  @ApiProperty({ type: () => Project, description: 'Project this deck belongs to' })
  project: Project;

  @OneToMany(() => Slide, (slide) => slide.deck, { cascade: true })
  @ApiProperty({ type: () => [Slide], description: 'Slides in this deck' })
  slides: Slide[];

  @OneToMany(() => DeckVersion, (version) => version.deck, { cascade: true })
  @ApiProperty({ type: () => [DeckVersion], description: 'Version history for this deck' })
  versions: DeckVersion[];

  @OneToMany(() => ContextMemoryEvent, (event) => event.deck, { cascade: true })
  @ApiProperty({ type: () => [ContextMemoryEvent], description: 'Context memory events for this deck' })
  contextEvents: ContextMemoryEvent[];

  @OneToMany(() => ChatContext, (chat) => chat.deck, { cascade: true })
  @ApiProperty({ type: () => [ChatContext], description: 'Chatbot conversations for this deck' })
  chatContexts: ChatContext[];
}
