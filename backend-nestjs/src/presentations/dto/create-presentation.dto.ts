import { IsString, IsNotEmpty, IsUUID, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePresentationDto {
  @ApiProperty({ 
    description: 'ID of the project this presentation belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ 
    description: 'Name of the presentation', 
    maxLength: 100,
    example: 'Q4 Investor Pitch'
  })
  @IsString({ message: 'Presentation name must be a string' })
  @IsNotEmpty({ message: 'Presentation name is required' })
  @MaxLength(100, { message: 'Presentation name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;
  
  @ApiProperty({ 
    description: 'Description of the presentation (optional)', 
    required: false,
    maxLength: 1000,
    example: 'Quarterly investor presentation covering financial performance and growth strategy.'
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;
}
