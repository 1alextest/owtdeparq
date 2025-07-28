import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateFreeDto {
  @ApiProperty({ description: 'ID of the project to create the deck in' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'Single prompt describing the pitch deck' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiProperty({ description: 'Preferred AI model', required: false })
  @IsString()
  @IsOptional()
  preferredModel?: string;

  @ApiProperty({ description: 'User API key for external providers', required: false })
  @IsString()
  @IsOptional()
  userApiKey?: string;
}
