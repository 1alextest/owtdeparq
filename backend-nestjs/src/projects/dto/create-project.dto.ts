import { IsString, IsNotEmpty, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @ApiProperty({ 
    description: 'Name of the project', 
    maxLength: 100,
    example: 'My Startup Pitch'
  })
  @IsString({ message: 'Project name must be a string' })
  @IsNotEmpty({ message: 'Project name is required' })
  @MaxLength(100, { message: 'Project name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;
  
  @ApiProperty({ 
    description: 'Description of the project (optional)', 
    required: false,
    maxLength: 1000,
    example: 'A detailed description of my startup idea and its value proposition.'
  })
  @IsString({ message: 'Project description must be a string' })
  @IsOptional()
  @MaxLength(1000, { message: 'Project description cannot exceed 1000 characters' })
  @Matches(/^[^<>]*$/, { 
    message: 'Project description cannot contain HTML tags for security reasons' 
  })
  @Transform(({ value }) => value?.trim())
  description?: string;
}
