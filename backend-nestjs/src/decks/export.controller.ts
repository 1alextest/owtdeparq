import {
  Controller,
  Post,
  Param,
  Res,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { DecksService } from './decks.service';
import { jsPDF } from 'jspdf';
const PptxGenJS = require('pptxgenjs');

@ApiTags('Deck Export')
@Controller('decks')
export class DeckExportController {
  constructor(private readonly decksService: DecksService) {}

  @Post(':id/export/pdf')
  @ApiOperation({ summary: 'Export deck as PDF' })
  @ApiResponse({ status: 200, description: 'PDF file generated and downloaded' })
  async exportPdf(
    @Param('id') deckId: string,
    @Body() options: any = {},
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Fetch deck and slides data
      const deck = await this.decksService.findOneForExport(deckId);
      const slides = deck.slides || [];
      
      // Create PDF using jsPDF
      const doc = new jsPDF();
      
      // Add title page
      doc.setFontSize(24);
      doc.text(deck.title || 'Pitch Deck', 20, 30);
      
      // Add generation mode info
      doc.setFontSize(12);
      doc.text(`Mode: ${deck.mode}`, 20, 50);
      
      if (deck.generationData?.prompt) {
        doc.text('Original Prompt:', 20, 70);
        const promptLines = doc.splitTextToSize(deck.generationData.prompt, 170);
        doc.text(promptLines, 20, 85);
      }
      
      // Add slides content - each slide gets its own page
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        // Add new page for each slide (including first slide)
        doc.addPage();
        let yPosition = 30;
        
        // Slide title with proper wrapping
        doc.setFontSize(18);
        const slideTitle = `Slide ${slide.slideOrder}: ${slide.title || 'Untitled'}`;
        const titleLines = doc.splitTextToSize(slideTitle, 170);
        doc.text(titleLines, 20, yPosition);
        yPosition += titleLines.length * 8 + 10;
        
        // Slide content with pagination
        if (slide.content) {
          doc.setFontSize(12);
          const lines = doc.splitTextToSize(slide.content, 170);
          
          // Calculate available space (leave room for speaker notes if needed)
          const reserveSpaceForNotes = options.include_speaker_notes && slide.speakerNotes ? 80 : 20;
          const maxYPosition = 280 - reserveSpaceForNotes;
          
          for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            // Check if we need a new page
            if (yPosition > maxYPosition) {
              doc.addPage();
              yPosition = 30;
              // Add continuation header with proper wrapping
              doc.setFontSize(14);
              const continuationTitle = `${slide.title || 'Untitled'} (continued)`;
              const continuationLines = doc.splitTextToSize(continuationTitle, 170);
              doc.text(continuationLines, 20, yPosition);
              yPosition += continuationLines.length * 6 + 10;
              doc.setFontSize(12);
            }
            
            doc.text(lines[lineIndex], 20, yPosition);
            yPosition += 6;
          }
        }
        
        // Speaker notes (if requested)
        if (options.include_speaker_notes && slide.speakerNotes) {
          yPosition += 15;
          
          // Check if speaker notes section fits on current page
          if (yPosition > 220) {
            doc.addPage();
            yPosition = 30;
          }
          
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text('Speaker Notes:', 20, yPosition);
          yPosition += 10;
          
          const notesLines = doc.splitTextToSize(slide.speakerNotes, 170);
          
          for (let noteIndex = 0; noteIndex < notesLines.length; noteIndex++) {
            // Check if we need a new page for notes
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 30;
              doc.text('Speaker Notes (continued):', 20, yPosition);
              yPosition += 10;
            }
            
            doc.text(notesLines[noteIndex], 20, yPosition);
            yPosition += 5;
          }
          
          doc.setTextColor(0); // Reset to black
        }
      }
      
      // Generate PDF buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="pitch-deck-${deckId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF export failed:', error);
      res.status(500).json({ 
        error: 'PDF export failed', 
        message: error.message 
      });
    }
  }

  @Post(':id/export/pptx')
  @ApiOperation({ summary: 'Export deck as PowerPoint' })
  @ApiResponse({ status: 200, description: 'PPTX file generated and downloaded' })
  async exportPptx(
    @Param('id') deckId: string,
    @Body() options: any = {},
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Fetch deck and slides data
      const deck = await this.decksService.findOneForExport(deckId);
      const slides = deck.slides || [];
      
      // Create PowerPoint using PptxGenJS
      const pptx = new PptxGenJS();
      
      // Add title slide
      const titleSlide = pptx.addSlide();
      titleSlide.addText(deck.title || 'Pitch Deck', { 
        x: 1, y: 2.5, w: 8, h: 1.5, 
        fontSize: 32, bold: true, color: '0066CC', align: 'center'
      });
      
      // Add generation mode info
      titleSlide.addText(`Generated using ${deck.mode} mode`, { 
        x: 1, y: 4.5, w: 8, h: 0.5, 
        fontSize: 14, align: 'center', color: '666666'
      });
      
      // Only add prompt if it's not too long
      if (deck.generationData?.prompt && deck.generationData.prompt.length < 200) {
        titleSlide.addText(`Prompt: ${deck.generationData.prompt}`, { 
          x: 1, y: 5.5, w: 8, h: 1, 
          fontSize: 12, align: 'center', color: '888888', wrap: true
        });
      }
      
      // Add content slides
      for (const slide of slides) {
        // Truncate content if too long to prevent overflow
        const maxContentLength = 800; // Approximate character limit for PowerPoint slide
        let slideContent = slide.content || '';
        
        if (slideContent.length > maxContentLength) {
          slideContent = slideContent.substring(0, maxContentLength) + '...';
        }
        
        const contentSlide = pptx.addSlide();
        
        // Slide title with truncation to prevent overflow
        let slideTitle = slide.title || 'Untitled';
        const maxTitleLength = 60; // Character limit for slide titles
        if (slideTitle.length > maxTitleLength) {
          slideTitle = slideTitle.substring(0, maxTitleLength) + '...';
        }
        
        contentSlide.addText(slideTitle, { 
          x: 0.5, y: 0.5, w: 9, h: 1, 
          fontSize: 24, bold: true, color: '0066CC', wrap: true
        });
        
        // Slide content with better sizing
        if (slideContent) {
          contentSlide.addText(slideContent, { 
            x: 0.5, y: 1.8, w: 9, h: 5.5, 
            fontSize: 14, valign: 'top', 
            wrap: true, autoFit: true
          });
        }
        
        // Speaker notes (if requested)
        if (options.include_speaker_notes && slide.speakerNotes) {
          // Truncate speaker notes if too long
          let speakerNotes = slide.speakerNotes;
          const maxNotesLength = 1000;
          if (speakerNotes.length > maxNotesLength) {
            speakerNotes = speakerNotes.substring(0, maxNotesLength) + '...';
          }
          contentSlide.addNotes(speakerNotes);
        }
      }
      
      // Generate PPTX buffer
      const pptxBuffer = await pptx.write('nodebuffer');
      
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="pitch-deck-${deckId}.pptx"`,
        'Content-Length': pptxBuffer.length.toString(),
      });

      res.send(pptxBuffer);
    } catch (error) {
      console.error('PPTX export failed:', error);
      res.status(500).json({ 
        error: 'PPTX export failed', 
        message: error.message 
      });
    }
  }
}