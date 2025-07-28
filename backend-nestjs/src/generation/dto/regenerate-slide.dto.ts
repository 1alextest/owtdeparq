import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegenerateSlideDto {
  @ApiProperty({ description: 'AI model choice for regeneration', required: false })
  @IsString()
  @IsOptional()
  modelChoice?: string;

  @ApiProperty({ description: 'User feedback for improvement', required: false })
  @IsString()
  @IsOptional()
  userFeedback?: string;

  @ApiProperty({ description: 'User API key for external providers', required: false })
  @IsString()
  @IsOptional()
  userApiKey?: string;
}
