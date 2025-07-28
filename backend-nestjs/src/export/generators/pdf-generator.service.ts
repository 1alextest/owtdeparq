import { Injectable, Logger } from '@nestjs/common';
import { jsPDF } from 'jspdf';
import { PitchDeck } from '../../entities/pitch-deck.entity';
import { Slide, SlideType } from '../../entities/slide.entity';

export interface PDFOptions {
  format?: 'A4' | 'letter' | 'presentation';
  orientation?: 'portrait' | 'landscape';
  template?: 'professional' | 'modern' | 'minimal' | 'executive';
  includeNotes?: boolean;
  includeCoverPage?: boolean;
  includeTableOfContents?: boolean;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'grayscale';
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
}

export interface PDFTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    lightGray: string;
  };
  fonts: {
    title: { size: number; style: string };
    subtitle: { size: number; style: string };
    body: { size: number; style: string };
    caption: { size: number; style: string };
  };
  spacing: {
    margin: number;
    lineHeight: number;
    sectionGap: number;
  };
}

@Injectable()
export class PDFGeneratorService {
  private readonly logger = new Logger(PDFGeneratorService.name);

  async generatePDF(
    deck: PitchDeck,
    options: PDFOptions = {}
  ): Promise<Buffer> {
    this.logger.log(`Generating PDF for deck: ${deck.title}`);

    // Initialize PDF with options
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: this.getPageFormat(options.format || 'A4'),
    });

    // Get theme configuration
    const theme = this.getThemeConfiguration(options);
    
    // Set document properties
    this.setDocumentProperties(pdf, deck);

    // Generate cover page
    if (options.includeCoverPage !== false) {
      this.generateCoverPage(pdf, deck, theme);
    }

    // Generate table of contents
    if (options.includeTableOfContents) {
      pdf.addPage();
      this.generateTableOfContents(pdf, deck, theme);
    }

    // Generate content pages
    const slides = deck.slides?.sort((a, b) => a.slideOrder - b.slideOrder) || [];
    for (let i = 0; i < slides.length; i++) {
      pdf.addPage();
      await this.generateSlidePage(pdf, slides[i], theme, options, i + 1);
    }

    // Generate notes section
    if (options.includeNotes) {
      pdf.addPage();
      this.generateNotesSection(pdf, slides, theme);
    }

    // Generate the PDF buffer
    const buffer = Buffer.from(pdf.output('arraybuffer'));
    
    this.logger.log(`PDF generated successfully: ${buffer.length} bytes`);
    return buffer;
  }

  private getPageFormat(format: string): [number, number] {
    const formats = {
      'A4': [210, 297],
      'letter': [216, 279],
      'presentation': [297, 210], // A4 landscape
    };
    return formats[format] || formats['A4'];
  }

  private getThemeConfiguration(options: PDFOptions): PDFTheme {
    const themes = {
      professional: {
        colors: {
          primary: '#1f4e79',
          secondary: '#70ad47',
          accent: '#ffc000',
          text: '#333333',
          background: '#ffffff',
          lightGray: '#f2f2f2',
        },
        fonts: {
          title: { size: 24, style: 'bold' },
          subtitle: { size: 18, style: 'bold' },
          body: { size: 12, style: 'normal' },
          caption: { size: 10, style: 'normal' },
        },
        spacing: {
          margin: 20,
          lineHeight: 1.5,
          sectionGap: 15,
        },
      },
      modern: {
        colors: {
          primary: '#2c3e50',
          secondary: '#3498db',
          accent: '#e74c3c',
          text: '#2c3e50',
          background: '#ffffff',
          lightGray: '#ecf0f1',
        },
        fonts: {
          title: { size: 26, style: 'bold' },
          subtitle: { size: 20, style: 'bold' },
          body: { size: 13, style: 'normal' },
          caption: { size: 11, style: 'normal' },
        },
        spacing: {
          margin: 25,
          lineHeight: 1.6,
          sectionGap: 18,
        },
      },
      minimal: {
        colors: {
          primary: '#000000',
          secondary: '#666666',
          accent: '#007acc',
          text: '#333333',
          background: '#ffffff',
          lightGray: '#f8f8f8',
        },
        fonts: {
          title: { size: 22, style: 'bold' },
          subtitle: { size: 16, style: 'bold' },
          body: { size: 11, style: 'normal' },
          caption: { size: 9, style: 'normal' },
        },
        spacing: {
          margin: 15,
          lineHeight: 1.4,
          sectionGap: 12,
        },
      },
      executive: {
        colors: {
          primary: '#8b0000',
          secondary: '#2f4f4f',
          accent: '#b8860b',
          text: '#2f2f2f',
          background: '#ffffff',
          lightGray: '#f5f5f5',
        },
        fonts: {
          title: { size: 28, style: 'bold' },
          subtitle: { size: 22, style: 'bold' },
          body: { size: 14, style: 'normal' },
          caption: { size: 12, style: 'normal' },
        },
        spacing: {
          margin: 30,
          lineHeight: 1.7,
          sectionGap: 20,
        },
      },
    };

    const selectedTheme = themes[options.template || 'professional'];
    
    // Apply custom colors if provided
    if (options.customColors) {
      selectedTheme.colors = { ...selectedTheme.colors, ...options.customColors };
    }

    return selectedTheme;
  }

  private setDocumentProperties(pdf: jsPDF, deck: PitchDeck): void {
    pdf.setProperties({
      title: deck.title,
      subject: 'Investor Pitch Deck',
      author: 'Pitch Deck Generator',
      creator: 'AI-Powered Presentations',
      // producer: 'PDF Generator Service', // Not supported in this version
    });
  }

  private generateCoverPage(pdf: jsPDF, deck: PitchDeck, theme: PDFTheme): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Background color
    pdf.setFillColor(theme.colors.background);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Header accent bar
    pdf.setFillColor(theme.colors.primary);
    pdf.rect(0, 0, pageWidth, 15, 'F');
    
    // Title
    pdf.setFont('helvetica', theme.fonts.title.style);
    pdf.setFontSize(theme.fonts.title.size);
    pdf.setTextColor(theme.colors.primary);
    
    const titleLines = pdf.splitTextToSize(deck.title, pageWidth - 2 * theme.spacing.margin);
    const titleY = pageHeight * 0.3;
    pdf.text(titleLines, pageWidth / 2, titleY, { align: 'center' });
    
    // Subtitle
    const subtitle = this.extractSubtitle(deck);
    if (subtitle) {
      pdf.setFont('helvetica', theme.fonts.subtitle.style);
      pdf.setFontSize(theme.fonts.subtitle.size);
      pdf.setTextColor(theme.colors.secondary);
      
      const subtitleY = titleY + (titleLines.length * theme.fonts.title.size * 0.35) + 20;
      pdf.text(subtitle, pageWidth / 2, subtitleY, { align: 'center' });
    }
    
    // Date
    pdf.setFont('helvetica', theme.fonts.body.style);
    pdf.setFontSize(theme.fonts.body.size);
    pdf.setTextColor(theme.colors.text);
    
    const dateText = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(dateText, pageWidth / 2, pageHeight * 0.8, { align: 'center' });
    
    // Footer accent bar
    pdf.setFillColor(theme.colors.accent);
    pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  }

  private generateTableOfContents(pdf: jsPDF, deck: PitchDeck, theme: PDFTheme): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    let currentY = theme.spacing.margin + 20;
    
    // Title
    pdf.setFont('helvetica', theme.fonts.title.style);
    pdf.setFontSize(theme.fonts.title.size);
    pdf.setTextColor(theme.colors.primary);
    pdf.text('Table of Contents', theme.spacing.margin, currentY);
    
    currentY += theme.spacing.sectionGap + 10;
    
    // Content list
    pdf.setFont('helvetica', theme.fonts.body.style);
    pdf.setFontSize(theme.fonts.body.size);
    pdf.setTextColor(theme.colors.text);
    
    const slides = deck.slides?.sort((a, b) => a.slideOrder - b.slideOrder) || [];
    slides.forEach((slide, index) => {
      const pageNumber = index + 2; // Adjust for cover page
      const dotLine = this.generateDotLine(slide.title, pageNumber.toString(), pageWidth - 2 * theme.spacing.margin);
      
      pdf.text(dotLine, theme.spacing.margin, currentY);
      currentY += theme.fonts.body.size * theme.spacing.lineHeight;
    });
  }

  private async generateSlidePage(
    pdf: jsPDF,
    slide: Slide,
    theme: PDFTheme,
    options: PDFOptions,
    pageNumber: number
  ): Promise<void> {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = theme.spacing.margin;

    // Header with slide type indicator
    this.addSlideHeader(pdf, slide, theme, pageNumber);
    currentY += 25;

    // Title
    pdf.setFont('helvetica', theme.fonts.title.style);
    pdf.setFontSize(theme.fonts.title.size);
    pdf.setTextColor(theme.colors.primary);

    const titleLines = pdf.splitTextToSize(slide.title, pageWidth - 2 * theme.spacing.margin);
    pdf.text(titleLines, theme.spacing.margin, currentY);
    currentY += titleLines.length * theme.fonts.title.size * 0.35 + theme.spacing.sectionGap;

    // Content
    pdf.setFont('helvetica', theme.fonts.body.style);
    pdf.setFontSize(theme.fonts.body.size);
    pdf.setTextColor(theme.colors.text);

    const formattedContent = this.formatContentForPDF(slide.content);
    const contentLines = pdf.splitTextToSize(formattedContent, pageWidth - 2 * theme.spacing.margin);

    // Check if content fits on page
    const contentHeight = contentLines.length * theme.fonts.body.size * theme.spacing.lineHeight;
    const availableHeight = pageHeight - currentY - theme.spacing.margin - 30; // Reserve space for footer

    if (contentHeight > availableHeight) {
      // Split content across pages if needed
      const linesPerPage = Math.floor(availableHeight / (theme.fonts.body.size * theme.spacing.lineHeight));
      const firstPageLines = contentLines.slice(0, linesPerPage);
      const remainingLines = contentLines.slice(linesPerPage);

      pdf.text(firstPageLines, theme.spacing.margin, currentY);

      if (remainingLines.length > 0) {
        pdf.addPage();
        pdf.text(remainingLines, theme.spacing.margin, theme.spacing.margin);
      }
    } else {
      pdf.text(contentLines, theme.spacing.margin, currentY);
    }

    // Add slide-specific visual elements
    this.addSlideSpecificElements(pdf, slide.slideType, theme);

    // Footer
    this.addPageFooter(pdf, theme, pageNumber);
  }

  private generateNotesSection(pdf: jsPDF, slides: Slide[], theme: PDFTheme): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    let currentY = theme.spacing.margin;

    // Section title
    pdf.setFont('helvetica', theme.fonts.title.style);
    pdf.setFontSize(theme.fonts.title.size);
    pdf.setTextColor(theme.colors.primary);
    pdf.text('Speaker Notes', theme.spacing.margin, currentY);

    currentY += theme.spacing.sectionGap + 10;

    slides.forEach((slide, index) => {
      if (slide.speakerNotes && slide.speakerNotes.trim()) {
        // Slide title
        pdf.setFont('helvetica', theme.fonts.subtitle.style);
        pdf.setFontSize(theme.fonts.subtitle.size);
        pdf.setTextColor(theme.colors.secondary);
        pdf.text(`${index + 1}. ${slide.title}`, theme.spacing.margin, currentY);

        currentY += theme.fonts.subtitle.size * 0.35 + 5;

        // Notes content
        pdf.setFont('helvetica', theme.fonts.body.style);
        pdf.setFontSize(theme.fonts.body.size);
        pdf.setTextColor(theme.colors.text);

        const notesLines = pdf.splitTextToSize(slide.speakerNotes, pageWidth - 2 * theme.spacing.margin);
        pdf.text(notesLines, theme.spacing.margin, currentY);

        currentY += notesLines.length * theme.fonts.body.size * theme.spacing.lineHeight + theme.spacing.sectionGap;

        // Check if we need a new page
        if (currentY > pdf.internal.pageSize.getHeight() - theme.spacing.margin - 30) {
          pdf.addPage();
          currentY = theme.spacing.margin;
        }
      }
    });
  }

  private addSlideHeader(pdf: jsPDF, slide: Slide, theme: PDFTheme, pageNumber: number): void {
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Header background
    pdf.setFillColor(theme.colors.lightGray);
    pdf.rect(0, 0, pageWidth, 20, 'F');

    // Slide type indicator
    const slideTypeLabel = this.getSlideTypeLabel(slide.slideType);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(theme.colors.primary);
    pdf.text(slideTypeLabel, theme.spacing.margin, 12);

    // Page number
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(theme.colors.secondary);
    pdf.text(`Page ${pageNumber}`, pageWidth - theme.spacing.margin - 20, 12);
  }

  private addPageFooter(pdf: jsPDF, theme: PDFTheme, pageNumber: number): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Footer line
    pdf.setDrawColor(theme.colors.lightGray);
    pdf.setLineWidth(0.5);
    pdf.line(theme.spacing.margin, pageHeight - 20, pageWidth - theme.spacing.margin, pageHeight - 20);

    // Footer text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(theme.fonts.caption.size);
    pdf.setTextColor(theme.colors.secondary);
    pdf.text('Generated by AI Pitch Deck Generator', theme.spacing.margin, pageHeight - 10);
  }

  private addSlideSpecificElements(pdf: jsPDF, slideType: SlideType, theme: PDFTheme): void {
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Add visual indicators based on slide type
    switch (slideType) {
      case 'problem':
        pdf.setFillColor('#e74c3c');
        pdf.circle(pageWidth - 30, 40, 3, 'F');
        break;
      case 'solution':
        pdf.setFillColor('#27ae60');
        pdf.circle(pageWidth - 30, 40, 3, 'F');
        break;
      case 'market':
        pdf.setFillColor(theme.colors.secondary);
        pdf.rect(pageWidth - 35, 37, 10, 6, 'F');
        break;
      case 'financials':
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor('#f39c12');
        pdf.text('$', pageWidth - 30, 45);
        break;
    }
  }

  private formatContentForPDF(content: string): string {
    // Clean up content for PDF display
    return content
      .replace(/•/g, '• ') // Ensure space after bullets
      .replace(/\n\n+/g, '\n\n') // Normalize line breaks
      .trim();
  }

  private generateDotLine(title: string, pageNumber: string, maxWidth: number): string {
    const titleLength = title.length;
    const pageNumLength = pageNumber.length;
    const dotsNeeded = Math.max(3, Math.floor((maxWidth / 6) - titleLength - pageNumLength - 2));
    const dots = '.'.repeat(dotsNeeded);
    return `${title} ${dots} ${pageNumber}`;
  }

  private getSlideTypeLabel(slideType: SlideType): string {
    const labels: Record<SlideType, string> = {
      cover: 'Cover',
      problem: 'Problem Statement',
      solution: 'Solution Overview',
      market: 'Market Analysis',
      product: 'Product Details',
      business_model: 'Business Model',
      go_to_market: 'Go-to-Market Strategy',
      competition: 'Competitive Analysis',
      team: 'Team & Leadership',
      financials: 'Financial Projections',
      traction: 'Traction & Milestones',
      funding_ask: 'Funding Request',
    };

    return labels[slideType] || 'Content Slide';
  }

  private extractSubtitle(deck: PitchDeck): string {
    const generationData = deck.generationData as any;

    if (generationData?.companyName) {
      return `${generationData.companyName} - Investor Presentation`;
    }

    return 'Investor Presentation';
  }
}
