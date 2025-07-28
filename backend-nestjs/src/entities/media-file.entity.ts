import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@Entity('media_files')
@Index('idx_media_files_user', ['userId', 'createdAt'])
@Index('idx_media_files_type', ['fileType', 'isAiSuggested'])
export class MediaFile {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the media file' })
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Firebase UID of the file owner' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Generated filename for storage' })
  filename: string;

  @Column({ name: 'original_filename', type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Original filename from upload' })
  originalFilename: string;

  @Column({ name: 'file_type', type: 'varchar', length: 50 })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Type of file (image, icon, document)' })
  fileType: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'MIME type of the file' })
  mimeType: string;

  @Column({ name: 'file_size', type: 'integer' })
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @Column({ name: 'file_url', type: 'text' })
  @IsUrl()
  @IsNotEmpty()
  @ApiProperty({ description: 'URL to access the file' })
  fileUrl: string;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  @IsUrl()
  @IsOptional()
  @ApiProperty({ description: 'URL to thumbnail image' })
  thumbnailUrl?: string;

  @Column({ name: 'storage_key', type: 'varchar', length: 500 })
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Storage key for cloud storage' })
  storageKey: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Associated project ID' })
  projectId?: string;

  @Column({ name: 'slide_id', type: 'uuid', nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Associated slide ID' })
  slideId?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'File description' })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ApiProperty({ description: 'File tags' })
  tags?: string[];

  @Column({ name: 'is_ai_suggested', type: 'boolean', default: false })
  @IsBoolean()
  @ApiProperty({ description: 'Whether this file was suggested by AI' })
  isAiSuggested: boolean;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ApiProperty({ description: 'Additional file metadata' })
  metadata: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  @ApiProperty({ description: 'File upload timestamp' })
  createdAt: Date;
}
