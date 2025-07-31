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
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from './project.entity';
import { PitchDeck } from './pitch-deck.entity';

@Entity('presentations')
@Index('idx_presentations_project', ['projectId'])
export class Presentation {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the presentation' })
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID of the project this presentation belongs to' })
  projectId: string;

  @Column({ type: 'text' })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Name of the presentation' })
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Description of the presentation', required: false })
  description?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Presentation creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Presentation last update timestamp' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Project, (project) => project.presentations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  @ApiProperty({ type: () => Project, description: 'Project this presentation belongs to' })
  project: Project;

  @OneToMany(() => PitchDeck, (deck) => deck.presentation, { cascade: true })
  @ApiProperty({ type: () => [PitchDeck], description: 'Decks in this presentation' })
  decks: PitchDeck[];
}
