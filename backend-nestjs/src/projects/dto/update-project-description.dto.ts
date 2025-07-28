import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProjectDescriptionDto {
  @ApiProperty({ 
    description: 'Description of the project', 
    required: true,
    maxLength: 1000,
    example: 'A detailed description of my startup idea and its value proposition.'
  })
  @IsString({ message: 'Project description must be a string' })
  @MaxLength(1000, { message: 'Project description cannot exceed 1000 characters' })
  @Matches(/^[^<>]*$/, { 
    message: 'Project description cannot contain HTML tags for security reasons' 
  })
  @Transform(({ value }) => value?.trim())
  description: string;
}