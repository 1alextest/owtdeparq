import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@Entity('slide_templates')
@Index('idx_templates_category', ['category', 'isActive'])
export class SlideTemplate {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the slide template' })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Name of the template' })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Category of the template (e.g., problem, solution, financials)' })
  category: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Description of the template' })
  description: string;

  @Column({ name: 'template_data', type: 'jsonb' })
  @IsNotEmpty()
  @ApiProperty({ description: 'Template layout, styling, and placeholder content' })
  templateData: any;

  @Column({ name: 'preview_image_url', type: 'text', nullable: true })
  @IsUrl()
  @IsOptional()
  @ApiProperty({ description: 'URL to preview image of the template' })
  previewImageUrl: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @IsBoolean()
  @ApiProperty({ description: 'Whether the template is active and available for use' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Template creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'Template last update timestamp' })
  updatedAt: Date;
}
