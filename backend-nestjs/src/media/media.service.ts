import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MediaFile } from '../entities/media-file.entity';
import { SlideType } from '../entities/slide.entity';

export interface MediaUploadOptions {
  projectId?: string;
  slideId?: string;
  description?: string;
  tags?: string[];
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(MediaFile)
    private mediaRepository: Repository<MediaFile>,
    private configService: ConfigService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    options: MediaUploadOptions = {}
  ): Promise<MediaFile> {
    this.logger.log(`Uploading file: ${file.originalname} for user: ${userId}`);

    // Simple file upload for testing
    const mediaFile = this.mediaRepository.create({
      userId,
      filename: `${Date.now()}-${file.originalname}`,
      originalFilename: file.originalname,
      fileType: this.getFileType(file.mimetype),
      mimeType: file.mimetype,
      fileSize: file.size,
      fileUrl: `https://placeholder.com/uploads/${Date.now()}-${file.originalname}`,
      storageKey: `uploads/${userId}/${Date.now()}-${file.originalname}`,
      isAiSuggested: false,
      projectId: options.projectId,
      slideId: options.slideId,
      description: options.description,
      tags: options.tags || [],
      metadata: {
        uploadedAt: new Date(),
        originalSize: file.size,
      },
    });

    const savedFile = await this.mediaRepository.save(mediaFile);
    this.logger.log(`File uploaded successfully: ${savedFile.id}`);

    return savedFile;
  }

  async suggestImages(options: any): Promise<any> {
    this.logger.log(`Generating image suggestions with options:`, options);

    // Simple placeholder for testing
    return {
      suggestions: [
        {
          id: 'test-1',
          url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
          thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300',
          title: 'Business Meeting',
          description: 'Professional business meeting',
          tags: ['business', 'meeting'],
          source: 'unsplash',
          license: 'Unsplash License',
          width: 1200,
          height: 800,
          relevanceScore: 0.9,
        },
      ],
      total: 1,
      query: options.query || '',
      filters: options,
    };
  }

  async suggestImagesForSlide(
    slideType: SlideType,
    slideTitle: string,
    slideContent: string,
    industry?: string,
    style: 'professional' | 'modern' | 'creative' | 'minimal' = 'professional'
  ): Promise<any> {
    this.logger.log(`Generating slide-specific suggestions for ${slideType}`);

    // Simple placeholder for testing
    return {
      suggestions: [
        {
          id: 'test-slide-1',
          url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984',
          thumbnailUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=300',
          title: `${slideType} Image`,
          description: `Image for ${slideType} slide`,
          tags: [slideType, industry || 'business'],
          source: 'unsplash',
          license: 'Unsplash License',
          width: 1200,
          height: 800,
          relevanceScore: 0.8,
        },
      ],
      total: 1,
      query: `${slideTitle} ${slideContent}`.substring(0, 100),
      filters: {
        slideType,
        slideContent,
        industry,
        style,
      },
    };
  }

  async downloadAndSaveImage(
    imageUrl: string,
    userId: string,
    options: {
      projectId?: string;
      slideId?: string;
      source?: string;
      attribution?: string;
      description?: string;
    } = {}
  ): Promise<MediaFile> {
    this.logger.log(`Downloading and saving image from: ${imageUrl}`);

    // Simple placeholder for testing
    const mediaFile = this.mediaRepository.create({
      userId,
      filename: `downloaded_${Date.now()}.jpg`,
      originalFilename: `downloaded_${Date.now()}.jpg`,
      fileType: 'image',
      mimeType: 'image/jpeg',
      fileSize: 1024000, // 1MB placeholder
      fileUrl: imageUrl,
      storageKey: `downloads/${userId}/${Date.now()}.jpg`,
      isAiSuggested: true,
      projectId: options.projectId,
      slideId: options.slideId,
      description: options.description,
      tags: [],
      metadata: {
        downloadedAt: new Date(),
        originalUrl: imageUrl,
        source: options.source,
        attribution: options.attribution,
      },
    });

    const savedFile = await this.mediaRepository.save(mediaFile);
    this.logger.log(`Image downloaded and saved: ${savedFile.id}`);

    return savedFile;
  }

  async getUserMedia(
    userId: string,
    options: {
      projectId?: string;
      slideId?: string;
      fileType?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ files: MediaFile[]; total: number }> {
    const queryBuilder = this.mediaRepository.createQueryBuilder('media')
      .where('media.userId = :userId', { userId })
      .orderBy('media.createdAt', 'DESC');

    if (options.projectId) {
      queryBuilder.andWhere('media.projectId = :projectId', { projectId: options.projectId });
    }

    if (options.slideId) {
      queryBuilder.andWhere('media.slideId = :slideId', { slideId: options.slideId });
    }

    if (options.fileType) {
      queryBuilder.andWhere('media.fileType = :fileType', { fileType: options.fileType });
    }

    const total = await queryBuilder.getCount();

    if (options.limit) {
      queryBuilder.limit(options.limit);
    }

    if (options.offset) {
      queryBuilder.offset(options.offset);
    }

    const files = await queryBuilder.getMany();

    return { files, total };
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting file: ${fileId} for user: ${userId}`);

    const file = await this.mediaRepository.findOne({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new Error('File not found or access denied');
    }

    // Simple delete for testing
    await this.mediaRepository.remove(file);
    this.logger.log(`File deleted successfully: ${fileId}`);
  }

  // Helper methods
  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    return 'document';
  }
}
