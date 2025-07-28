import { IsString, IsNotEmpty, IsUUID, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventType, LearningScope } from '../../entities/context-memory-event.entity';

export class RecordEventDto {
  @ApiProperty({ description: 'ID of the project' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'ID of the deck' })
  @IsUUID()
  @IsNotEmpty()
  deckId: string;

  @ApiProperty({ 
    description: 'Type of event',
    enum: ['user_input', 'ai_generation', 'user_edit', 'feedback', 'chatbot_interaction']
  })
  @IsIn(['user_input', 'ai_generation', 'user_edit', 'feedback', 'chatbot_interaction'])
  eventType: EventType;

  @ApiProperty({ description: 'Event content and data' })
  @IsNotEmpty()
  content: any;

  @ApiProperty({ 
    description: 'Learning scope',
    enum: ['deck', 'project', 'global'],
    required: false,
    default: 'deck'
  })
  @IsIn(['deck', 'project', 'global'])
  @IsOptional()
  learningScope?: LearningScope;
}

export class UpdateLearningPatternDto {
  @ApiProperty({ description: 'Pattern data to update or create' })
  @IsNotEmpty()
  patternData: any;

  @ApiProperty({ description: 'Confidence score for the pattern (0.0 to 1.0)' })
  @IsOptional()
  confidenceScore?: number;
}
