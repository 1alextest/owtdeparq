import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';
import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @ApiProperty({ 
    description: 'Description of the project (optional)', 
    required: false,
    maxLength: 1000,
    example: 'Updated description of my startup idea.'
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
