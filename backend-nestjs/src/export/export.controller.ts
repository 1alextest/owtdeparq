import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService, ExportOptions } from './export.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';

@ApiTags('Export')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('deck/:deckId/pdf')
  @ApiOperation({ summary: 'Export deck as PDF' })
  @ApiResponse({ status: 200, description: 'PDF file generated' })
  async exportPdf(
    @Param('deckId') deckId: string,
    @User() user: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const pdfBuffer = await this.exportService.generatePdf(deckId, user.uid);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="pitch-deck.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    
    res.send(pdfBuffer);
  }

  @Post('deck/:deckId/pptx')
  @ApiOperation({ summary: 'Export deck as PowerPoint' })
  @ApiResponse({ status: 200, description: 'PPTX file generated' })
  async exportPptx(
    @Param('deckId') deckId: string,
    @User() user: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const pptxBuffer = await this.exportService.generatePptx(deckId, user.uid);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': 'attachment; filename="pitch-deck.pptx"',
      'Content-Length': pptxBuffer.length,
    });
    
    res.send(pptxBuffer);
  }

  @Post('deck/:deckId/advanced')
  @ApiOperation({ summary: 'Export deck with advanced options' })
  @ApiResponse({ status: 200, description: 'File generated with custom options' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['pdf', 'pptx', 'html', 'markdown', 'json', 'csv'] },
        template: { type: 'string', enum: ['professional', 'modern', 'minimal', 'creative', 'executive'] },
        includeNotes: { type: 'boolean' },
        includeBranding: { type: 'boolean' },
        colorScheme: { type: 'string', enum: ['blue', 'green', 'purple', 'orange', 'grayscale'] },
        customOptions: { type: 'object' },
      },
      required: ['format'],
    },
  })
  async exportAdvanced(
    @Param('deckId') deckId: string,
    @Body() options: ExportOptions,
    @User() user: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.exportService.exportDeck(deckId, user.uid, options);

    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.size,
    });

    res.send(result.buffer);
  }

  @Post('deck/:deckId/multiple')
  @ApiOperation({ summary: 'Export deck in multiple formats as ZIP' })
  @ApiResponse({ status: 200, description: 'ZIP archive with multiple formats' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        formats: {
          type: 'array',
          items: { type: 'string', enum: ['pdf', 'pptx', 'html', 'markdown', 'json', 'csv'] },
        },
      },
      required: ['formats'],
    },
  })
  async exportMultiple(
    @Param('deckId') deckId: string,
    @Body() body: { formats: string[] },
    @User() user: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const zipBuffer = await this.exportService.generateMultipleFormats(
      deckId,
      user.uid,
      body.formats
    );

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="pitch-deck-exports.zip"',
      'Content-Length': zipBuffer.length,
    });

    res.send(zipBuffer);
  }

  @Get('formats')
  @ApiOperation({ summary: 'Get available export formats' })
  @ApiResponse({ status: 200, description: 'List of available export formats' })
  async getExportFormats() {
    return await this.exportService.getExportFormats();
  }

  @Get('deck/:deckId/preview')
  @ApiOperation({ summary: 'Get export preview information' })
  @ApiResponse({ status: 200, description: 'Export preview details' })
  @ApiQuery({ name: 'format', required: true, enum: ['pdf', 'pptx', 'html', 'markdown', 'json', 'csv'] })
  async getExportPreview(
    @Param('deckId') deckId: string,
    @Query('format') format: string,
    @User() user: AuthenticatedUser,
  ) {
    return await this.exportService.getExportPreview(deckId, user.uid, format);
  }
}
