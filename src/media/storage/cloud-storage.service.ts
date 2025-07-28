import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';
import * as mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';

export interface UploadOptions {
  folder?: string;
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  generateThumbnail?: boolean;
  makePublic?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  publicUrl?: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface StorageConfig {
  provider: 'aws' | 'gcp' | 'local';
  aws?: {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    cloudFrontDomain?: string;
  };
  local?: {
    uploadPath: string;
    baseUrl: string;
  };
}

@Injectable()
export class CloudStorageService {
  private readonly logger = new Logger(CloudStorageService.name);
  private s3Client: S3Client;
  private config: StorageConfig;

  constructor(private configService: ConfigService) {
    this.config = this.loadStorageConfig();
    this.initializeStorage();
  }

  private loadStorageConfig(): StorageConfig {
    const provider = this.configService.get<string>('STORAGE_PROVIDER', 'local') as 'aws' | 'gcp' | 'local';
    
    const config: StorageConfig = { provider };

    if (provider === 'aws') {
      config.aws = {
        region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
        bucket: this.configService.get<string>('AWS_S3_BUCKET'),
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
        cloudFrontDomain: this.configService.get<string>('AWS_CLOUDFRONT_DOMAIN'),
      };
    } else if (provider === 'local') {
      config.local = {
        uploadPath: this.configService.get<string>('LOCAL_UPLOAD_PATH', './uploads'),
        baseUrl: this.configService.get<string>('LOCAL_BASE_URL', 'http://localhost:3000'),
      };
    }

    return config;
  }

  private initializeStorage(): void {
    if (this.config.provider === 'aws' && this.config.aws) {
      this.s3Client = new S3Client({
        region: this.config.aws.region,
        credentials: {
          accessKeyId: this.config.aws.accessKeyId,
          secretAccessKey: this.config.aws.secretAccessKey,
        },
      });
      this.logger.log(`Initialized AWS S3 storage in region: ${this.config.aws.region}`);
    } else {
      this.logger.log('Initialized local file storage');
    }
  }

  async uploadFile(
    file: Buffer | Express.Multer.File,
    filename: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    this.logger.log(`Uploading file: ${filename}`);

    const buffer = Buffer.isBuffer(file) ? file : file.buffer;
    const originalMimeType = Buffer.isBuffer(file) ? mime.lookup(filename) || 'application/octet-stream' : file.mimetype;
    
    // Process image if needed
    const processedImage = await this.processImage(buffer, originalMimeType, options);
    
    // Generate unique key
    const key = this.generateFileKey(filename, options.folder);
    
    // Upload main file
    const uploadResult = await this.uploadToStorage(key, processedImage.buffer, processedImage.mimeType, options.makePublic);
    
    let thumbnailResult: { key: string; url: string } | undefined;
    
    // Generate thumbnail if requested and it's an image
    if (options.generateThumbnail && this.isImage(originalMimeType)) {
      const thumbnailBuffer = await this.generateThumbnail(buffer);
      const thumbnailKey = this.generateThumbnailKey(key);
      thumbnailResult = await this.uploadToStorage(thumbnailKey, thumbnailBuffer, 'image/jpeg', options.makePublic);
    }

    return {
      key,
      url: uploadResult.url,
      publicUrl: uploadResult.publicUrl,
      thumbnailKey: thumbnailResult?.key,
      thumbnailUrl: thumbnailResult?.url,
      size: processedImage.buffer.length,
      mimeType: processedImage.mimeType,
      width: processedImage.width,
      height: processedImage.height,
    };
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.config.provider === 'aws') {
      const command = new GetObjectCommand({
        Bucket: this.config.aws.bucket,
        Key: key,
      });
      
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } else {
      // For local storage, return direct URL
      return `${this.config.local.baseUrl}/uploads/${key}`;
    }
  }

  async deleteFile(key: string): Promise<void> {
    this.logger.log(`Deleting file: ${key}`);
    
    if (this.config.provider === 'aws') {
      const command = new DeleteObjectCommand({
        Bucket: this.config.aws.bucket,
        Key: key,
      });
      
      await this.s3Client.send(command);
    } else {
      // For local storage, delete from filesystem
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(this.config.local.uploadPath, key);
      
      try {
        await fs.unlink(filePath);
      } catch (error) {
        this.logger.warn(`Failed to delete local file: ${filePath}`, error);
      }
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      if (this.config.provider === 'aws') {
        const command = new HeadObjectCommand({
          Bucket: this.config.aws.bucket,
          Key: key,
        });
        
        await this.s3Client.send(command);
        return true;
      } else {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.join(this.config.local.uploadPath, key);
        
        await fs.access(filePath);
        return true;
      }
    } catch {
      return false;
    }
  }

  private async processImage(
    buffer: Buffer,
    mimeType: string,
    options: UploadOptions
  ): Promise<{ buffer: Buffer; mimeType: string; width?: number; height?: number }> {
    if (!this.isImage(mimeType)) {
      return { buffer, mimeType };
    }

    let sharpInstance = sharp(buffer);
    
    // Resize if specified
    if (options.resize) {
      sharpInstance = sharpInstance.resize({
        width: options.resize.width,
        height: options.resize.height,
        fit: options.resize.fit || 'cover',
        withoutEnlargement: true,
      });
    }

    // Convert format if specified
    if (options.format) {
      switch (options.format) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality: options.quality || 85 });
          mimeType = 'image/jpeg';
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality: options.quality || 85 });
          mimeType = 'image/png';
          break;
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality: options.quality || 85 });
          mimeType = 'image/webp';
          break;
      }
    }

    const processedBuffer = await sharpInstance.toBuffer();
    const metadata = await sharp(processedBuffer).metadata();

    return {
      buffer: processedBuffer,
      mimeType,
      width: metadata.width,
      height: metadata.height,
    };
  }

  private async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .resize(300, 300, { fit: 'cover', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  private async uploadToStorage(
    key: string,
    buffer: Buffer,
    mimeType: string,
    makePublic: boolean = false
  ): Promise<{ url: string; publicUrl?: string }> {
    if (this.config.provider === 'aws') {
      const command = new PutObjectCommand({
        Bucket: this.config.aws.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ACL: makePublic ? 'public-read' : 'private',
      });

      await this.s3Client.send(command);

      const url = await this.getSignedUrl(key);
      const publicUrl = makePublic && this.config.aws.cloudFrontDomain
        ? `https://${this.config.aws.cloudFrontDomain}/${key}`
        : makePublic
        ? `https://${this.config.aws.bucket}.s3.${this.config.aws.region}.amazonaws.com/${key}`
        : undefined;

      return { url, publicUrl };
    } else {
      // Local storage implementation
      const fs = await import('fs/promises');
      const path = await import('path');

      const uploadDir = this.config.local.uploadPath;
      const filePath = path.join(uploadDir, key);
      const fileDir = path.dirname(filePath);

      // Ensure directory exists
      await fs.mkdir(fileDir, { recursive: true });

      // Write file
      await fs.writeFile(filePath, buffer);

      const url = `${this.config.local.baseUrl}/uploads/${key}`;
      return { url, publicUrl: makePublic ? url : undefined };
    }
  }

  private generateFileKey(filename: string, folder?: string): string {
    const ext = filename.split('.').pop();
    const uuid = uuidv4();
    const timestamp = Date.now();

    const key = `${uuid}_${timestamp}.${ext}`;

    return folder ? `${folder}/${key}` : key;
  }

  private generateThumbnailKey(originalKey: string): string {
    const parts = originalKey.split('.');
    const ext = parts.pop();
    const base = parts.join('.');

    return `${base}_thumb.jpg`;
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  getStorageConfig(): StorageConfig {
    return this.config;
  }

  async getFileInfo(key: string): Promise<{
    size: number;
    lastModified: Date;
    mimeType: string;
  } | null> {
    try {
      if (this.config.provider === 'aws') {
        const command = new HeadObjectCommand({
          Bucket: this.config.aws.bucket,
          Key: key,
        });

        const response = await this.s3Client.send(command);

        return {
          size: response.ContentLength || 0,
          lastModified: response.LastModified || new Date(),
          mimeType: response.ContentType || 'application/octet-stream',
        };
      } else {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.join(this.config.local.uploadPath, key);

        const stats = await fs.stat(filePath);
        const mimeType = mime.lookup(filePath) || 'application/octet-stream';

        return {
          size: stats.size,
          lastModified: stats.mtime,
          mimeType,
        };
      }
    } catch {
      return null;
    }
  }
}
