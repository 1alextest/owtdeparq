import { Injectable, Logger } from '@nestjs/common';
import { DecksService } from '../decks/decks.service';
import { PowerPointGeneratorService, PowerPointOptions } from './generators/powerpoint-generator.service';
import { PDFGeneratorService, PDFOptions } from './generators/pdf-generator.service';
import { TemplateGeneratorService, TemplateOptions } from './generators/template-generator.service';
import * as archiver from 'archiver';
import { Readable } from 'stream';

export interface ExportOptions {
  format: 'pdf' | 'pptx' | 'html' | 'markdown' | 'json' | 'csv';
  template?: string;
  includeNotes?: boolean;
  includeBranding?: boolean;
  colorScheme?: string;
  customOptions?: any;
}

export interface ExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    private decksService: DecksService,
    private powerPointGenerator: PowerPointGeneratorService,
    private pdfGenerator: PDFGeneratorService,
    private templateGenerator: TemplateGeneratorService,
  ) {}

  async exportDeck(deckId: string, userId: string, options: ExportOptions): Promise<ExportResult> {
    this.logger.log(`Exporting deck ${deckId} as ${options.format}`);

    const deck = await this.decksService.findOne(deckId, userId);

    let buffer: Buffer;
    let filename: string;
    let mimeType: string;

    switch (options.format) {
      case 'pdf':
        buffer = await this.generateAdvancedPDF(deck, options);
        filename = `${this.sanitizeFilename(deck.title)}.pdf`;
        mimeType = 'application/pdf';
        break;

      case 'pptx':
        buffer = await this.generateAdvancedPowerPoint(deck, options);
        filename = `${this.sanitizeFilename(deck.title)}.pptx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;

      case 'html':
      case 'markdown':
      case 'json':
      case 'csv':
        const result = await this.generateTemplate(deck, options);
        buffer = result.buffer;
        filename = result.filename;
        mimeType = result.mimeType;
        break;

      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    this.logger.log(`Export completed: ${filename} (${buffer.length} bytes)`);

    return {
      buffer,
      filename,
      mimeType,
      size: buffer.length,
    };
  }

  async generatePdf(deckId: string, userId: string): Promise<Buffer> {
    const result = await this.exportDeck(deckId, userId, { format: 'pdf' });
    return result.buffer;
  }

  async generatePptx(deckId: string, userId: string): Promise<Buffer> {
    const result = await this.exportDeck(deckId, userId, { format: 'pptx' });
    return result.buffer;
  }

  async generateMultipleFormats(
    deckId: string,
    userId: string,
    formats: string[]
  ): Promise<Buffer> {
    this.logger.log(`Generating multiple formats for deck ${deckId}: ${formats.join(', ')}`);

    const deck = await this.decksService.findOne(deckId, userId);
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk) => chunks.push(chunk));

    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);
    });

    // Generate each format
    for (const format of formats) {
      try {
        const result = await this.exportDeck(deckId, userId, { format: format as any });
        archive.append(result.buffer, { name: result.filename });
      } catch (error) {
        this.logger.error(`Failed to generate ${format}:`, error);
        // Continue with other formats
      }
    }

    archive.finalize();
    return archivePromise;
  }

  private async generateAdvancedPDF(deck: any, options: ExportOptions): Promise<Buffer> {
    const pdfOptions: PDFOptions = {
      format: 'A4',
      orientation: 'portrait',
      template: options.template as any || 'professional',
      includeNotes: options.includeNotes || false,
      includeCoverPage: true,
      includeTableOfContents: true,
      colorScheme: options.colorScheme as any || 'blue',
      ...options.customOptions,
    };

    return await this.pdfGenerator.generatePDF(deck, pdfOptions);
  }

  private async generateAdvancedPowerPoint(deck: any, options: ExportOptions): Promise<Buffer> {
    const pptxOptions: PowerPointOptions = {
      template: options.template as any || 'professional',
      colorScheme: options.colorScheme as any || 'blue',
      includeNotes: options.includeNotes || false,
      includeBranding: options.includeBranding || true,
      ...options.customOptions,
    };

    return await this.powerPointGenerator.generatePowerPoint(deck, pptxOptions);
  }

  private async generateTemplate(deck: any, options: ExportOptions): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }> {
    const templateOptions: TemplateOptions = {
      templateType: options.format as any,
      includeMetadata: true,
      includeNotes: options.includeNotes || false,
      customStyling: true,
      exportFormat: 'single',
      ...options.customOptions,
    };

    const result = await this.templateGenerator.generateTemplate(deck, options.format, templateOptions);

    if (Buffer.isBuffer(result)) {
      const templates = this.templateGenerator.getAvailableTemplates();
      const template = templates[options.format];

      return {
        buffer: result,
        filename: `${this.sanitizeFilename(deck.title)}.${template.fileExtension}`,
        mimeType: template.mimeType,
      };
    } else {
      // Multiple files - create archive
      const archive = archiver('zip', { zlib: { level: 9 } });
      const chunks: Buffer[] = [];

      archive.on('data', (chunk) => chunks.push(chunk));

      const archivePromise = new Promise<Buffer>((resolve, reject) => {
        archive.on('end', () => resolve(Buffer.concat(chunks)));
        archive.on('error', reject);
      });

      result.files.forEach(file => {
        archive.append(file.content, { name: file.name });
      });

      archive.finalize();
      const buffer = await archivePromise;

      return {
        buffer,
        filename: `${this.sanitizeFilename(deck.title)}_${options.format}.zip`,
        mimeType: 'application/zip',
      };
    }
  }

  async getExportFormats(): Promise<Array<{ format: string; name: string; description: string }>> {
    const templates = this.templateGenerator.getAvailableTemplates();

    return [
      {
        format: 'pdf',
        name: 'PDF Document',
        description: 'Professional PDF with advanced styling and layouts',
      },
      {
        format: 'pptx',
        name: 'PowerPoint Presentation',
        description: 'Native PowerPoint file with slides and speaker notes',
      },
      ...Object.entries(templates).map(([key, template]) => ({
        format: key,
        name: template.name,
        description: template.description,
      })),
    ];
  }

  async getExportPreview(deckId: string, userId: string, format: string): Promise<{
    preview: string;
    estimatedSize: string;
    features: string[];
  }> {
    const deck = await this.decksService.findOne(deckId, userId);
    const slideCount = deck.slides?.length || 0;

    const formatInfo = {
      pdf: {
        estimatedSize: `${Math.ceil(slideCount * 0.5)} MB`,
        features: ['Professional styling', 'Table of contents', 'Speaker notes', 'Page numbers'],
      },
      pptx: {
        estimatedSize: `${Math.ceil(slideCount * 0.3)} MB`,
        features: ['Native PowerPoint format', 'Editable slides', 'Speaker notes', 'Custom themes'],
      },
      html: {
        estimatedSize: `${Math.ceil(slideCount * 0.1)} MB`,
        features: ['Interactive navigation', 'Responsive design', 'CSS styling', 'Web-ready'],
      },
      markdown: {
        estimatedSize: `${Math.ceil(slideCount * 0.05)} MB`,
        features: ['Plain text format', 'Version control friendly', 'Documentation ready'],
      },
      json: {
        estimatedSize: `${Math.ceil(slideCount * 0.02)} MB`,
        features: ['Structured data', 'API integration', 'Machine readable'],
      },
      csv: {
        estimatedSize: `${Math.ceil(slideCount * 0.01)} MB`,
        features: ['Spreadsheet compatible', 'Data analysis ready', 'Tabular format'],
      },
    };

    const info = formatInfo[format] || formatInfo.pdf;

    return {
      preview: `${deck.title} - ${slideCount} slides`,
      estimatedSize: info.estimatedSize,
      features: info.features,
    };
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9\s\-_]/gi, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .substring(0, 50);
  }
}
