import { IsString, IsBoolean, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LearningScope } from '../../entities/user-ai-settings.entity';

export class UpdateAiSettingsDto {
  @ApiProperty({ description: 'User\'s personal OpenAI API key', required: false })
  @IsString()
  @IsOptional()
  openaiApiKey?: string;

  @ApiProperty({ description: 'Whether AI learning is enabled', required: false })
  @IsBoolean()
  @IsOptional()
  learningEnabled?: boolean;

  @ApiProperty({ 
    description: 'Scope of AI learning',
    enum: ['deck', 'project', 'global', 'off'],
    required: false
  })
  @IsIn(['deck', 'project', 'global', 'off'])
  @IsOptional()
  learningScope?: LearningScope;
}
