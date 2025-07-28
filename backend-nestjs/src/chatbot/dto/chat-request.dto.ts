import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ description: 'User message to the chatbot' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'ID of the deck being discussed' })
  @IsUUID()
  @IsNotEmpty()
  deckId: string;

  @ApiProperty({ description: 'ID of specific slide being discussed', required: false })
  @IsUUID()
  @IsOptional()
  slideId?: string;

  @ApiProperty({ description: 'Additional context for the conversation', required: false })
  @IsOptional()
  context?: any;
}

export class ImproveSpeakerNotesDto {
  @ApiProperty({ description: 'ID of the slide to improve' })
  @IsUUID()
  @IsNotEmpty()
  slideId: string;

  @ApiProperty({ description: 'Current speaker notes' })
  @IsString()
  @IsNotEmpty()
  currentNotes: string;

  @ApiProperty({ 
    description: 'Type of improvement',
    enum: ['clarity', 'engagement', 'structure', 'detail']
  })
  @IsString()
  @IsNotEmpty()
  improvementType: string;
}
