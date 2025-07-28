import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';
import { IsString, IsBoolean, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export type LearningScope = 'deck' | 'project' | 'global' | 'off';

@Entity('user_ai_settings')
@Check(`learning_scope IN ('deck', 'project', 'global', 'off')`)
export class UserAiSettings {
  @PrimaryColumn({ name: 'user_id', type: 'varchar', length: 255 })
  @IsString()
  @ApiProperty({ description: 'Firebase UID of the user' })
  userId: string;

  @Column({ name: 'openai_api_key', type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'User\'s personal OpenAI API key (encrypted)' })
  openaiApiKey: string;

  @Column({ name: 'learning_enabled', type: 'boolean', default: true })
  @IsBoolean()
  @ApiProperty({ description: 'Whether AI learning is enabled for this user' })
  learningEnabled: boolean;

  @Column({ 
    name: 'learning_scope', 
    type: 'varchar', 
    length: 20, 
    default: 'deck' 
  })
  @IsIn(['deck', 'project', 'global', 'off'])
  @ApiProperty({ 
    description: 'Scope of AI learning',
    enum: ['deck', 'project', 'global', 'off'],
    default: 'deck'
  })
  learningScope: LearningScope;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Settings creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Settings last update timestamp' })
  updatedAt: Date;
}
