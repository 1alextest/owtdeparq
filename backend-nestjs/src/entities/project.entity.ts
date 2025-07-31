import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PitchDeck } from './pitch-deck.entity';
import { ContextMemoryEvent } from './context-memory-event.entity';
import { LearningPattern } from './learning-pattern.entity';

@Entity('projects')
@Index('idx_projects_user_id', ['userId'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the project' })
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Firebase UID of the project owner' })
  userId: string;

  @Column({ type: 'text' })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Name of the project' })
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Description of the project', required: false })
  description?: string;

  @Column({ name: 'description_updated_at', type: 'timestamp with time zone', nullable: true })
  @ApiProperty({ description: 'Last description update timestamp', required: false })
  descriptionUpdatedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Project creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Project last update timestamp' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => PitchDeck, (deck) => deck.project, { cascade: true })
  @ApiProperty({ type: () => [PitchDeck], description: 'Pitch decks in this project' })
  decks: PitchDeck[];

  @OneToMany(() => ContextMemoryEvent, (event) => event.project, { cascade: true })
  @ApiProperty({ type: () => [ContextMemoryEvent], description: 'Context memory events for this project' })
  contextEvents: ContextMemoryEvent[];

  @OneToMany(() => LearningPattern, (pattern) => pattern.project, { cascade: true })
  @ApiProperty({ type: () => [LearningPattern], description: 'Learning patterns for this project' })
  learningPatterns: LearningPattern[];
}
