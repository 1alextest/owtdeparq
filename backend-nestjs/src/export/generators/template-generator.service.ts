import { Injectable, Logger } from '@nestjs/common';
import { PitchDeck } from '../../entities/pitch-deck.entity';
import { Slide, SlideType } from '../../entities/slide.entity';
import * as archiver from 'archiver';
import { Readable } from 'stream';

export interface TemplateOptions {
  templateType?: 'html' | 'markdown' | 'json' | 'csv';
  includeMetadata?: boolean;
  includeNotes?: boolean;
  customStyling?: boolean;
  exportFormat?: 'single' | 'multiple' | 'archive';
}

export interface ExportTemplate {
  name: string;
  description: string;
  fileExtension: string;
  mimeType: string;
  supportsMultipleFiles: boolean;
}

@Injectable()
export class TemplateGeneratorService {
  private readonly logger = new Logger(TemplateGeneratorService.name);

  private readonly templates: Record<string, ExportTemplate> = {
    html: {
      name: 'HTML Presentation',
      description: 'Interactive HTML presentation with CSS styling',
      fileExtension: 'html',
      mimeType: 'text/html',
      supportsMultipleFiles: true,
    },
    markdown: {
      name: 'Markdown Document',
      description: 'Structured markdown document for documentation',
      fileExtension: 'md',
      mimeType: 'text/markdown',
      supportsMultipleFiles: false,
    },
    json: {
      name: 'JSON Data Export',
      description: 'Structured JSON data for API integration',
      fileExtension: 'json',
      mimeType: 'application/json',
      supportsMultipleFiles: false,
    },
    csv: {
      name: 'CSV Spreadsheet',
      description: 'Tabular data export for analysis',
      fileExtension: 'csv',
      mimeType: 'text/csv',
      supportsMultipleFiles: false,
    },
  };

  async generateTemplate(
    deck: PitchDeck,
    templateType: string,
    options: TemplateOptions = {}
  ): Promise<Buffer | { files: Array<{ name: string; content: Buffer }> }> {
    this.logger.log(`Generating ${templateType} template for deck: ${deck.title}`);

    const template = this.templates[templateType];
    if (!template) {
      throw new Error(`Unsupported template type: ${templateType}`);
    }

    switch (templateType) {
      case 'html':
        return this.generateHTMLTemplate(deck, options);
      case 'markdown':
        return this.generateMarkdownTemplate(deck, options);
      case 'json':
        return this.generateJSONTemplate(deck, options);
      case 'csv':
        return this.generateCSVTemplate(deck, options);
      default:
        throw new Error(`Template generator not implemented for: ${templateType}`);
    }
  }

  async generateHTMLTemplate(
    deck: PitchDeck,
    options: TemplateOptions
  ): Promise<Buffer | { files: Array<{ name: string; content: Buffer }> }> {
    const slides = deck.slides?.sort((a, b) => a.slideOrder - b.slideOrder) || [];

    if (options.exportFormat === 'multiple') {
      // Generate separate HTML files for each slide
      const files = [];
      
      // Index file
      const indexContent = this.generateHTMLIndex(deck, slides);
      files.push({
        name: 'index.html',
        content: Buffer.from(indexContent, 'utf-8'),
      });

      // Individual slide files
      slides.forEach((slide, index) => {
        const slideContent = this.generateHTMLSlide(slide, index, slides.length, options);
        files.push({
          name: `slide-${index + 1}.html`,
          content: Buffer.from(slideContent, 'utf-8'),
        });
      });

      // CSS file
      const cssContent = this.generateHTMLCSS(options);
      files.push({
        name: 'styles.css',
        content: Buffer.from(cssContent, 'utf-8'),
      });

      return { files };
    } else {
      // Generate single HTML file
      const htmlContent = this.generateSingleHTMLFile(deck, slides, options);
      return Buffer.from(htmlContent, 'utf-8');
    }
  }

  private generateHTMLIndex(deck: PitchDeck, slides: Slide[]): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${deck.title}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="presentation-index">
        <header>
            <h1>${deck.title}</h1>
            <p class="subtitle">${this.extractSubtitle(deck)}</p>
            <p class="date">${new Date().toLocaleDateString()}</p>
        </header>
        
        <nav class="slide-navigation">
            <h2>Presentation Outline</h2>
            <ul>
                ${slides.map((slide, index) => `
                    <li>
                        <a href="slide-${index + 1}.html">
                            <span class="slide-number">${index + 1}</span>
                            <span class="slide-title">${slide.title}</span>
                            <span class="slide-type">${this.getSlideTypeLabel(slide.slideType)}</span>
                        </a>
                    </li>
                `).join('')}
            </ul>
        </nav>
        
        <footer>
            <p>Generated by AI Pitch Deck Generator</p>
        </footer>
    </div>
</body>
</html>`;
  }

  private generateHTMLSlide(slide: Slide, index: number, totalSlides: number, options: TemplateOptions): string {
    const prevSlide = index > 0 ? `slide-${index}.html` : 'index.html';
    const nextSlide = index < totalSlides - 1 ? `slide-${index + 2}.html` : 'index.html';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${slide.title}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="slide-container">
        <header class="slide-header">
            <span class="slide-type">${this.getSlideTypeLabel(slide.slideType)}</span>
            <span class="slide-counter">${index + 1} / ${totalSlides}</span>
        </header>
        
        <main class="slide-content">
            <h1>${slide.title}</h1>
            <div class="content">
                ${this.formatHTMLContent(slide.content)}
            </div>
        </main>
        
        ${options.includeNotes && slide.speakerNotes ? `
        <aside class="speaker-notes">
            <h3>Speaker Notes</h3>
            <p>${slide.speakerNotes}</p>
        </aside>
        ` : ''}
        
        <nav class="slide-navigation">
            <a href="${prevSlide}" class="nav-button prev">← Previous</a>
            <a href="index.html" class="nav-button home">Index</a>
            <a href="${nextSlide}" class="nav-button next">Next →</a>
        </nav>
    </div>
</body>
</html>`;
  }

  private generateSingleHTMLFile(deck: PitchDeck, slides: Slide[], options: TemplateOptions): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${deck.title}</title>
    <style>
        ${this.generateHTMLCSS(options)}
    </style>
</head>
<body>
    <div class="presentation">
        <header class="title-slide">
            <h1>${deck.title}</h1>
            <p class="subtitle">${this.extractSubtitle(deck)}</p>
            <p class="date">${new Date().toLocaleDateString()}</p>
        </header>
        
        ${slides.map((slide, index) => `
        <section class="slide" id="slide-${index + 1}">
            <header class="slide-header">
                <span class="slide-type">${this.getSlideTypeLabel(slide.slideType)}</span>
                <span class="slide-number">${index + 1}</span>
            </header>
            <h2>${slide.title}</h2>
            <div class="content">
                ${this.formatHTMLContent(slide.content)}
            </div>
            ${options.includeNotes && slide.speakerNotes ? `
            <aside class="speaker-notes">
                <h4>Speaker Notes</h4>
                <p>${slide.speakerNotes}</p>
            </aside>
            ` : ''}
        </section>
        `).join('')}
        
        <footer>
            <p>Generated by AI Pitch Deck Generator on ${new Date().toLocaleDateString()}</p>
        </footer>
    </div>
</body>
</html>`;
  }

  private generateMarkdownTemplate(deck: PitchDeck, options: TemplateOptions): Buffer {
    const slides = deck.slides?.sort((a, b) => a.slideOrder - b.slideOrder) || [];
    
    let markdown = `# ${deck.title}\n\n`;
    
    // Add metadata if requested
    if (options.includeMetadata) {
      markdown += `**Generated:** ${new Date().toLocaleDateString()}\n`;
      markdown += `**Subtitle:** ${this.extractSubtitle(deck)}\n`;
      markdown += `**Total Slides:** ${slides.length}\n\n`;
      markdown += `---\n\n`;
    }

    // Table of contents
    markdown += `## Table of Contents\n\n`;
    slides.forEach((slide, index) => {
      markdown += `${index + 1}. [${slide.title}](#slide-${index + 1})\n`;
    });
    markdown += `\n---\n\n`;

    // Slides content
    slides.forEach((slide, index) => {
      markdown += `## Slide ${index + 1}: ${slide.title} {#slide-${index + 1}}\n\n`;
      markdown += `**Type:** ${this.getSlideTypeLabel(slide.slideType)}\n\n`;
      markdown += `${this.formatMarkdownContent(slide.content)}\n\n`;
      
      if (options.includeNotes && slide.speakerNotes) {
        markdown += `### Speaker Notes\n\n`;
        markdown += `${slide.speakerNotes}\n\n`;
      }
      
      markdown += `---\n\n`;
    });

    return Buffer.from(markdown, 'utf-8');
  }

  private generateJSONTemplate(deck: PitchDeck, options: TemplateOptions): Buffer {
    const slides = deck.slides?.sort((a, b) => a.slideOrder - b.slideOrder) || [];

    const jsonData = {
      metadata: options.includeMetadata ? {
        title: deck.title,
        subtitle: this.extractSubtitle(deck),
        generatedAt: new Date().toISOString(),
        totalSlides: slides.length,
        mode: deck.mode,
        generationData: deck.generationData,
      } : undefined,
      presentation: {
        title: deck.title,
        slides: slides.map((slide, index) => ({
          id: slide.id,
          order: index + 1,
          type: slide.slideType,
          typeLabel: this.getSlideTypeLabel(slide.slideType),
          title: slide.title,
          content: slide.content,
          speakerNotes: options.includeNotes ? slide.speakerNotes : undefined,
          metadata: {
            createdAt: slide.createdAt,
            updatedAt: slide.updatedAt,
            generatedBy: slide.generatedBy,
          },
        })),
      },
    };

    return Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8');
  }

  private generateCSVTemplate(deck: PitchDeck, options: TemplateOptions): Buffer {
    const slides = deck.slides?.sort((a, b) => a.slideOrder - b.slideOrder) || [];

    let csv = 'Order,Type,Title,Content';
    if (options.includeNotes) {
      csv += ',Speaker Notes';
    }
    if (options.includeMetadata) {
      csv += ',Created At,Updated At,Generated By';
    }
    csv += '\n';

    slides.forEach((slide, index) => {
      const row = [
        index + 1,
        slide.slideType,
        `"${slide.title.replace(/"/g, '""')}"`,
        `"${slide.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      ];

      if (options.includeNotes) {
        row.push(`"${(slide.speakerNotes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`);
      }

      if (options.includeMetadata) {
        row.push(
          slide.createdAt?.toISOString() || '',
          slide.updatedAt?.toISOString() || '',
          slide.generatedBy || ''
        );
      }

      csv += row.join(',') + '\n';
    });

    return Buffer.from(csv, 'utf-8');
  }

  private generateHTMLCSS(options: TemplateOptions): string {
    return `
/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f8f9fa;
}

/* Presentation styles */
.presentation {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.title-slide {
    text-align: center;
    padding: 60px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 10px;
    margin-bottom: 40px;
}

.title-slide h1 {
    font-size: 3em;
    margin-bottom: 20px;
    font-weight: 300;
}

.subtitle {
    font-size: 1.5em;
    margin-bottom: 10px;
    opacity: 0.9;
}

.date {
    font-size: 1.1em;
    opacity: 0.8;
}

/* Slide styles */
.slide {
    background: white;
    border-radius: 10px;
    padding: 40px;
    margin-bottom: 30px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-left: 5px solid #667eea;
}

.slide-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #f1f3f4;
}

.slide-type {
    background: #667eea;
    color: white;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 0.9em;
    font-weight: 500;
}

.slide-number {
    color: #666;
    font-weight: 500;
}

.slide h2 {
    color: #2c3e50;
    font-size: 2.2em;
    margin-bottom: 25px;
    font-weight: 400;
}

.content {
    font-size: 1.1em;
    line-height: 1.8;
    color: #444;
}

.content ul {
    margin-left: 20px;
    margin-bottom: 20px;
}

.content li {
    margin-bottom: 10px;
}

.speaker-notes {
    margin-top: 30px;
    padding: 20px;
    background: #f8f9fa;
    border-left: 4px solid #ffc107;
    border-radius: 5px;
}

.speaker-notes h4 {
    color: #856404;
    margin-bottom: 10px;
}

.speaker-notes p {
    color: #6c757d;
    font-style: italic;
}

/* Navigation styles */
.slide-navigation {
    text-align: center;
    margin-top: 40px;
    padding: 20px;
}

.nav-button {
    display: inline-block;
    padding: 12px 24px;
    margin: 0 10px;
    background: #667eea;
    color: white;
    text-decoration: none;
    border-radius: 25px;
    transition: all 0.3s ease;
    font-weight: 500;
}

.nav-button:hover {
    background: #5a6fd8;
    transform: translateY(-2px);
}

/* Index page styles */
.presentation-index {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
}

.presentation-index header {
    text-align: center;
    margin-bottom: 50px;
}

.presentation-index h1 {
    font-size: 2.5em;
    color: #2c3e50;
    margin-bottom: 15px;
}

.slide-navigation ul {
    list-style: none;
}

.slide-navigation li {
    margin-bottom: 15px;
}

.slide-navigation a {
    display: flex;
    align-items: center;
    padding: 15px 20px;
    background: white;
    border-radius: 8px;
    text-decoration: none;
    color: #333;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.slide-navigation a:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.slide-navigation .slide-number {
    background: #667eea;
    color: white;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    font-weight: bold;
}

.slide-navigation .slide-title {
    flex: 1;
    font-weight: 500;
}

.slide-navigation .slide-type {
    color: #666;
    font-size: 0.9em;
}

footer {
    text-align: center;
    margin-top: 50px;
    padding: 20px;
    color: #666;
    border-top: 1px solid #e9ecef;
}

/* Responsive design */
@media (max-width: 768px) {
    .presentation {
        padding: 10px;
    }

    .slide {
        padding: 20px;
    }

    .title-slide h1 {
        font-size: 2em;
    }

    .slide h2 {
        font-size: 1.8em;
    }
}
`;
  }

  // Helper methods
  private formatHTMLContent(content: string): string {
    // Convert content to HTML format
    return content
      .split('\n')
      .map(line => {
        line = line.trim();
        if (!line) return '';

        // Handle bullet points
        if (line.startsWith('•') || line.startsWith('-')) {
          return `<li>${line.substring(1).trim()}</li>`;
        }

        // Handle regular paragraphs
        return `<p>${line}</p>`;
      })
      .filter(line => line)
      .join('\n')
      .replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>\n${match}</ul>\n`);
  }

  private formatMarkdownContent(content: string): string {
    // Ensure proper markdown formatting
    return content
      .split('\n')
      .map(line => {
        line = line.trim();
        if (!line) return '';

        // Handle bullet points
        if (line.startsWith('•')) {
          return `- ${line.substring(1).trim()}`;
        }

        return line;
      })
      .filter(line => line)
      .join('\n');
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

  getAvailableTemplates(): Record<string, ExportTemplate> {
    return this.templates;
  }
}
