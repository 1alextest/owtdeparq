import { IsString, IsNotEmpty, IsUUID, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeckMode } from '../../entities/pitch-deck.entity';

export class CreateDeckDto {
  @ApiProperty({ description: 'ID of the project this deck belongs to' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'Title of the pitch deck' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Generation mode', enum: ['free', 'custom'] })
  @IsIn(['free', 'custom'])
  mode: DeckMode;

  @ApiProperty({ description: 'Original generation data', required: false })
  @IsOptional()
  generationData?: any;
}
