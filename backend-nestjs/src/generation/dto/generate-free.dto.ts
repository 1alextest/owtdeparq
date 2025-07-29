import { IsString, IsNotEmpty, IsUUID, IsOptional, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GenerateFreeDto {
  @ApiProperty({ description: 'ID of the project to create the deck in' })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({
    description: 'Single prompt describing the pitch deck',
    minLength: 10,
    maxLength: 5000,
    example: 'My startup TechFlow is a SaaS platform that helps small businesses automate their workflow processes...'
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 5000, { message: 'Prompt must be between 10 and 5000 characters' })
  @Transform(({ value }) => value?.trim())
  // Prevent common prompt injection patterns
  @Matches(/^[^<>{}[\]\\\/]*$/, { message: 'Prompt contains invalid characters' })
  prompt: string;

  @ApiProperty({
    description: 'Preferred AI model',
    required: false,
    enum: ['openai', 'groq-llama-8b', 'groq-llama-70b', 'groq-gemma', 'llama3.1-8b', 'llama3.1-instruct', 'llama3.1-70b']
  })
  @IsString()
  @IsOptional()
  @Matches(/^(openai|groq-llama-8b|groq-llama-70b|groq-gemma|llama3\.1-8b|llama3\.1-instruct|llama3\.1-70b)$/, {
    message: 'Invalid model selection'
  })
  preferredModel?: string;

  @ApiProperty({ description: 'User API key for external providers', required: false })
  @IsString()
  @IsOptional()
  @Length(10, 200, { message: 'API key must be between 10 and 200 characters' })
  userApiKey?: string;
}
