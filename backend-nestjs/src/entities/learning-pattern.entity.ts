import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { IsString, IsNotEmpty, IsUUID, IsIn, IsOptional, IsDecimal, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from './project.entity';

export type ScopeType = 'deck' | 'project' | 'global';
export type PatternType = 'content_preference' | 'style_preference' | 'correction_pattern';

@Entity('user_learning_patterns')
@Index('idx_learning_patterns_user_scope', ['userId', 'scopeType', 'scopeId'])
@Index('idx_learning_patterns_confidence', ['confidenceScore'])
@Check(`scope_type IN ('deck', 'project', 'global')`)
@Check(`pattern_type IN ('content_preference', 'style_preference', 'correction_pattern')`)
@Check(`confidence_score >= 0.00 AND confidence_score <= 1.00`)
export class LearningPattern {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the learning pattern' })
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Firebase UID of the user' })
  userId: string;

  @Column({ name: 'scope_type', type: 'varchar', length: 20 })
  @IsIn(['deck', 'project', 'global'])
  @ApiProperty({ 
    description: 'Scope type for this pattern',
    enum: ['deck', 'project', 'global']
  })
  scopeType: ScopeType;

  @Column({ name: 'scope_id', type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  @ApiProperty({ description: 'ID of the scope (deck_id, project_id, or NULL for global)' })
  scopeId: string;

  @Column({ name: 'pattern_type', type: 'varchar', length: 50 })
  @IsIn(['content_preference', 'style_preference', 'correction_pattern'])
  @ApiProperty({ 
    description: 'Type of learning pattern',
    enum: ['content_preference', 'style_preference', 'correction_pattern']
  })
  patternType: PatternType;

  @Column({ name: 'pattern_data', type: 'jsonb' })
  @IsNotEmpty()
  @ApiProperty({ description: 'Pattern data and preferences' })
  patternData: any;

  @Column({ 
    name: 'confidence_score', 
    type: 'decimal', 
    precision: 3, 
    scale: 2, 
    default: 0.50 
  })
  @IsDecimal({ decimal_digits: '2' })
  @Min(0.00)
  @Max(1.00)
  @ApiProperty({ 
    description: 'Confidence score for this pattern (0.00 to 1.00)',
    minimum: 0.00,
    maximum: 1.00,
    default: 0.50
  })
  confidenceScore: number;

  @UpdateDateColumn({ name: 'last_reinforced', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Last time this pattern was reinforced' })
  lastReinforced: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Pattern creation timestamp' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Project, (project) => project.learningPatterns, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'scope_id' })
  @ApiProperty({ type: () => Project, description: 'Project this pattern belongs to (if scope is project)' })
  project: Project;
}
