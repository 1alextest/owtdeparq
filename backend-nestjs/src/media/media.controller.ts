import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService, MediaUploadOptions } from './media.service';
import { Express } from 'express';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { SlideType } from '../entities/slide.entity';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload media file with advanced options' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: MediaUploadOptions,
    @User() user: AuthenticatedUser,
  ) {
    return this.mediaService.uploadFile(file, user.uid, options);
  }

  @Get('files')
  @ApiOperation({ summary: 'Get user media files' })
  @ApiResponse({ status: 200, description: 'User media files retrieved' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'slideId', required: false })
  @ApiQuery({ name: 'fileType', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getUserFiles(
    @User() user: AuthenticatedUser,
    @Query('projectId') projectId?: string,
    @Query('slideId') slideId?: string,
    @Query('fileType') fileType?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.mediaService.getUserMedia(user.uid, {
      projectId,
      slideId,
      fileType,
      limit,
      offset,
    });
  }

  @Delete('files/:fileId')
  @ApiOperation({ summary: 'Delete media file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async deleteFile(
    @Param('fileId') fileId: string,
    @User() user: AuthenticatedUser,
  ) {
    await this.mediaService.deleteFile(fileId, user.uid);
    return { success: true, message: 'File deleted successfully' };
  }





  @Post('suggest-images')
  @ApiOperation({ summary: 'Get AI-suggested images with advanced options' })
  @ApiResponse({ status: 200, description: 'Image suggestions generated' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        slideType: { type: 'string' },
        slideContent: { type: 'string' },
        industry: { type: 'string' },
        style: { type: 'string', enum: ['professional', 'modern', 'creative', 'minimal'] },
        orientation: { type: 'string', enum: ['landscape', 'portrait', 'square'] },
        color: { type: 'string' },
        limit: { type: 'number', minimum: 1, maximum: 50 },
      },
    },
  })
  async suggestImages(
    @Body() options: any,
    @User() user: AuthenticatedUser,
  ): Promise<any> {
    return this.mediaService.suggestImages(options);
  }

  @Post('suggest-images/slide')
  @ApiOperation({ summary: 'Get slide-specific image suggestions' })
  @ApiResponse({ status: 200, description: 'Slide-specific image suggestions generated' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        slideType: { type: 'string' },
        slideTitle: { type: 'string' },
        slideContent: { type: 'string' },
        industry: { type: 'string' },
        style: { type: 'string', enum: ['professional', 'modern', 'creative', 'minimal'] },
      },
      required: ['slideType', 'slideTitle', 'slideContent'],
    },
  })
  async suggestImagesForSlide(
    @Body() body: {
      slideType: SlideType;
      slideTitle: string;
      slideContent: string;
      industry?: string;
      style?: 'professional' | 'modern' | 'creative' | 'minimal';
    },
    @User() user: AuthenticatedUser,
  ): Promise<any> {
    return this.mediaService.suggestImagesForSlide(
      body.slideType,
      body.slideTitle,
      body.slideContent,
      body.industry,
      body.style || 'professional'
    );
  }

  @Post('download-image')
  @ApiOperation({ summary: 'Download and save image from URL' })
  @ApiResponse({ status: 201, description: 'Image downloaded and saved successfully' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        imageUrl: { type: 'string', format: 'uri' },
        projectId: { type: 'string' },
        slideId: { type: 'string' },
        source: { type: 'string' },
        attribution: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['imageUrl'],
    },
  })
  async downloadImage(
    @Body() body: {
      imageUrl: string;
      projectId?: string;
      slideId?: string;
      source?: string;
      attribution?: string;
      description?: string;
    },
    @User() user: AuthenticatedUser,
  ) {
    return this.mediaService.downloadAndSaveImage(body.imageUrl, user.uid, {
      projectId: body.projectId,
      slideId: body.slideId,
      source: body.source,
      attribution: body.attribution,
      description: body.description,
    });
  }
}
