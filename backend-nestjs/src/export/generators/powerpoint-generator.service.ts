import { Injectable, Logger } from '@nestjs/common';
const PptxGenJS = require('pptxgenjs');
import { PitchDeck } from '../../entities/pitch-deck.entity';
import { Slide, SlideType } from '../../entities/slide.entity';

export interface PowerPointOptions {
  template?: 'professional' | 'modern' | 'minimal' | 'creative';
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'custom';
  includeNotes?: boolean;
  includeBranding?: boolean;
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
}

export interface SlideLayout {
  title: { x: number; y: number; w: number; h: number };
  content: { x: number; y: number; w: number; h: number };
  notes?: { x: number; y: number; w: number; h: number };
}

@Injectable()
export class PowerPointGeneratorService {
  private readonly logger = new Logger(PowerPointGeneratorService.name);

  async generatePowerPoint(
    deck: PitchDeck,
    options: PowerPointOptions = {}
  ): Promise<Buffer> {
    this.logger.log(`Generating PowerPoint for deck: ${deck.title}`);

    const pptx = new PptxGenJS();
    
    // Configure presentation settings
    this.configurePresentationSettings(pptx, options);
    
    // Apply template and styling
    const theme = this.getThemeConfiguration(options);
    
    // Generate title slide
    await this.generateTitleSlide(pptx, deck, theme);
    
    // Generate content slides
    const slides = deck.slides?.sort((a, b) => a.slideOrder - b.slideOrder) || [];
    for (const slide of slides) {
      await this.generateContentSlide(pptx, slide, theme, options);
    }
    
    // Generate closing slide if needed
    if (options.includeBranding) {
      await this.generateClosingSlide(pptx, deck, theme);
    }

    // Generate the PowerPoint file
    const buffer = await this.generateBuffer(pptx);
    
    this.logger.log(`PowerPoint generated successfully: ${buffer.length} bytes`);
    return buffer;
  }

  private configurePresentationSettings(pptx: any, options: PowerPointOptions): void {
    // Set presentation properties
    pptx.author = 'Pitch Deck Generator';
    pptx.company = 'AI-Powered Presentations';
    pptx.subject = 'Investor Pitch Deck';
    pptx.title = 'Generated Pitch Deck';
    
    // Configure slide size (16:9 widescreen)
    pptx.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
    pptx.layout = 'LAYOUT_16x9';
  }

  private getThemeConfiguration(options: PowerPointOptions): any {
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
          title: { face: 'Calibri', size: 32, bold: true },
          subtitle: { face: 'Calibri', size: 24, bold: false },
          body: { face: 'Calibri', size: 18, bold: false },
          caption: { face: 'Calibri', size: 14, bold: false },
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
          title: { face: 'Segoe UI', size: 36, bold: true },
          subtitle: { face: 'Segoe UI', size: 26, bold: false },
          body: { face: 'Segoe UI', size: 20, bold: false },
          caption: { face: 'Segoe UI', size: 16, bold: false },
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
          title: { face: 'Arial', size: 34, bold: true },
          subtitle: { face: 'Arial', size: 24, bold: false },
          body: { face: 'Arial', size: 18, bold: false },
          caption: { face: 'Arial', size: 14, bold: false },
        },
      },
      creative: {
        colors: {
          primary: '#8e44ad',
          secondary: '#f39c12',
          accent: '#e67e22',
          text: '#2c3e50',
          background: '#ffffff',
          lightGray: '#f4f4f4',
        },
        fonts: {
          title: { face: 'Georgia', size: 32, bold: true },
          subtitle: { face: 'Georgia', size: 24, bold: false },
          body: { face: 'Georgia', size: 18, bold: false },
          caption: { face: 'Georgia', size: 14, bold: false },
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

  private async generateTitleSlide(pptx: any, deck: PitchDeck, theme: any): Promise<void> {
    const slide = pptx.addSlide();
    
    // Background
    slide.background = { fill: theme.colors.background };
    
    // Company name/title
    slide.addText(deck.title, {
      x: 1,
      y: 1.5,
      w: 8,
      h: 1.5,
      fontSize: theme.fonts.title.size,
      fontFace: theme.fonts.title.face,
      bold: theme.fonts.title.bold,
      color: theme.colors.primary,
      align: 'center',
    });

    // Subtitle or tagline
    const subtitle = this.extractSubtitle(deck);
    if (subtitle) {
      slide.addText(subtitle, {
        x: 1,
        y: 3,
        w: 8,
        h: 1,
        fontSize: theme.fonts.subtitle.size,
        fontFace: theme.fonts.subtitle.face,
        color: theme.colors.secondary,
        align: 'center',
      });
    }

    // Date
    slide.addText(new Date().toLocaleDateString(), {
      x: 8,
      y: 4.5,
      w: 1.5,
      h: 0.5,
      fontSize: theme.fonts.caption.size,
      fontFace: theme.fonts.caption.face,
      color: theme.colors.text,
      align: 'right',
    });

    // Decorative element
    slide.addShape(pptx.ShapeType.rect, {
      x: 1,
      y: 4.8,
      w: 8,
      h: 0.1,
      fill: { color: theme.colors.accent },
    });
  }

  private async generateContentSlide(
    pptx: any,
    slideData: Slide,
    theme: any,
    options: PowerPointOptions
  ): Promise<void> {
    const slide = pptx.addSlide();
    
    // Background
    slide.background = { fill: theme.colors.background };
    
    // Get slide layout based on type
    const layout = this.getSlideLayout(slideData.slideType);
    
    // Title
    slide.addText(slideData.title, {
      x: layout.title.x,
      y: layout.title.y,
      w: layout.title.w,
      h: layout.title.h,
      fontSize: theme.fonts.title.size,
      fontFace: theme.fonts.title.face,
      bold: theme.fonts.title.bold,
      color: theme.colors.primary,
    });

    // Content
    const formattedContent = this.formatSlideContent(slideData.content, slideData.slideType);
    slide.addText(formattedContent, {
      x: layout.content.x,
      y: layout.content.y,
      w: layout.content.w,
      h: layout.content.h,
      fontSize: theme.fonts.body.size,
      fontFace: theme.fonts.body.face,
      color: theme.colors.text,
      valign: 'top',
    });

    // Speaker notes
    if (options.includeNotes && slideData.speakerNotes) {
      slide.addNotes(slideData.speakerNotes);
    }

    // Slide number
    slide.addText(`${slideData.slideOrder + 1}`, {
      x: 9.2,
      y: 5,
      w: 0.5,
      h: 0.3,
      fontSize: theme.fonts.caption.size,
      fontFace: theme.fonts.caption.face,
      color: theme.colors.secondary,
      align: 'center',
    });

    // Add slide-specific styling
    this.addSlideSpecificStyling(slide, slideData.slideType, theme);
  }

  private async generateClosingSlide(pptx: any, deck: PitchDeck, theme: any): Promise<void> {
    const slide = pptx.addSlide();

    slide.background = { fill: theme.colors.background };

    // Thank you message
    slide.addText('Thank You', {
      x: 1,
      y: 2,
      w: 8,
      h: 1.5,
      fontSize: 48,
      fontFace: theme.fonts.title.face,
      bold: true,
      color: theme.colors.primary,
      align: 'center',
    });

    // Contact information or next steps
    slide.addText('Questions & Discussion', {
      x: 1,
      y: 3.5,
      w: 8,
      h: 1,
      fontSize: theme.fonts.subtitle.size,
      fontFace: theme.fonts.subtitle.face,
      color: theme.colors.secondary,
      align: 'center',
    });
  }

  private getSlideLayout(slideType: SlideType): SlideLayout {
    const layouts: Record<SlideType, SlideLayout> = {
      cover: {
        title: { x: 1, y: 1.5, w: 8, h: 1.5 },
        content: { x: 1, y: 3, w: 8, h: 2 },
      },
      problem: {
        title: { x: 0.5, y: 0.3, w: 9, h: 0.8 },
        content: { x: 0.5, y: 1.2, w: 9, h: 3.8 },
      },
      solution: {
        title: { x: 0.5, y: 0.3, w: 9, h: 0.8 },
        content: { x: 0.5, y: 1.2, w: 9, h: 3.8 },
      },
      market: {
        title: { x: 0.5, y: 0.3, w: 9, h: 0.8 },
        content: { x: 0.5, y: 1.2, w: 9, h: 3.8 },
      },
      product: {
        title: { x: 0.5, y: 0.3, w: 9, h: 0.8 },
        content: { x: 0.5, y: 1.2, w: 9, h: 3.8 },
      },
      business_model: {
        title: { x: 0.5, y: 0.3, w: 9, h: 0.8 },
        content: { x: 0.5, y: 1.2, w: 9, h: 3.8 },
      },
      go_to_market: {
        title: { x: 0.5, y: 0.3, w: 9, h: 0.8 },
        content: { x: 0.5, y: 1.2, w: 9, h: 3.8 },
      },
      competition: {
        title: { x: 0.5, y: 0.3, w: 9, h: 0.8 },
        content: { x: 0.5, y: 1.2, w: 9, h: 3.8 },
      },
      team: {
        title: { x: 0.5, y: 0.3, w: 9, h: 0.8 },
        content: { x: 0.5, y: 1.2, w: 9, h: 3.8 },
      },
      financials: {
        title: { x: 0.5, y: 0.3, w: 9, h: 0.8 },
        content: { x: 0.5, y: 1.2, w: 9, h: 3.8 },
      },
      traction: {
        title: { x: 0.5, y: 0.3, w: 9, h: 0.8 },
        content: { x: 0.5, y: 1.2, w: 9, h: 3.8 },
      },
      funding_ask: {
        title: { x: 0.5, y: 0.3, w: 9, h: 0.8 },
        content: { x: 0.5, y: 1.2, w: 9, h: 3.8 },
      },
    };

    return layouts[slideType] || layouts.cover;
  }

  private formatSlideContent(content: string, slideType: SlideType): any[] {
    // Convert content to PowerPoint-friendly format
    const lines = content.split('\n').filter(line => line.trim());

    // Check if content has bullet points
    const hasBullets = lines.some(line => line.trim().startsWith('•') || line.trim().startsWith('-'));

    if (hasBullets) {
      // Format as bullet points
      return lines.map(line => {
        const cleanLine = line.replace(/^[•\-\*]\s*/, '').trim();
        return {
          text: cleanLine,
          options: { bullet: true, indentLevel: 0 }
        };
      });
    } else {
      // Format as paragraphs
      return [{ text: content, options: {} }];
    }
  }

  private addSlideSpecificStyling(slide: any, slideType: SlideType, theme: any): void {
    // Add slide-type specific visual elements
    switch (slideType) {
      case 'problem':
        // Add warning icon or red accent
        slide.addShape('triangle', {
          x: 0.2,
          y: 0.4,
          w: 0.3,
          h: 0.3,
          fill: { color: '#e74c3c' },
        });
        break;

      case 'solution':
        // Add checkmark or green accent
        slide.addShape('rect', {
          x: 0.2,
          y: 0.4,
          w: 0.3,
          h: 0.3,
          fill: { color: '#27ae60' },
        });
        break;

      case 'market':
        // Add chart icon or blue accent
        slide.addShape('rect', {
          x: 0.2,
          y: 0.4,
          w: 0.3,
          h: 0.3,
          fill: { color: theme.colors.secondary },
        });
        break;

      case 'financials':
        // Add dollar sign or financial accent
        slide.addText('$', {
          x: 0.2,
          y: 0.4,
          w: 0.3,
          h: 0.3,
          fontSize: 24,
          fontFace: theme.fonts.title.face,
          bold: true,
          color: '#f39c12',
          align: 'center',
        });
        break;
    }
  }

  private extractSubtitle(deck: PitchDeck): string {
    // Extract subtitle from deck data
    const generationData = deck.generationData as any;

    if (generationData?.companyName) {
      return `${generationData.companyName} - Investor Presentation`;
    }

    return 'Investor Presentation';
  }

  private async generateBuffer(pptx: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      pptx.writeFile({ fileName: 'temp' }, (data) => {
        if (data instanceof Buffer) {
          resolve(data);
        } else {
          // Convert data to buffer if needed
          resolve(Buffer.from(data));
        }
      });
    });
  }
}
