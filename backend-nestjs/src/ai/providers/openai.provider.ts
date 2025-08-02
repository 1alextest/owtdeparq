import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PromptTemplates, PromptContext } from '../prompts/prompt-templates';
import { SlideType } from '../../entities/slide.entity';

export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  userApiKey?: string;
  retryCount?: number;
}

export interface SlideGenerationResult {
  title: string;
  content: string;
  speakerNotes?: string;
  confidence: number;
  model: string;
  tokensUsed: number;
}

@Injectable()
export class OpenaiProvider {
  private readonly logger = new Logger(OpenaiProvider.name);
  private openai: OpenAI;
  private defaultApiKey: string;
  private readonly DEFAULT_MODEL = 'gpt-4';
  private readonly FALLBACK_MODEL = 'gpt-3.5-turbo';

  constructor(private configService: ConfigService) {
    this.defaultApiKey = this.configService.get<string>('OPENAI_API_KEY');
    const isEnabled = this.configService.get<string>('OPENAI_ENABLED', 'true') === 'true';
    
    if (this.defaultApiKey && !this.defaultApiKey.includes('dummy') && isEnabled) {
      this.openai = new OpenAI({
        apiKey: this.defaultApiKey,
      });
    } else {
      this.logger.warn('OpenAI provider disabled - no valid API key or explicitly disabled');
    }
  }

  async generateSlideContent(
    slideType: SlideType,
    context: PromptContext,
    options: GenerationOptions = {}
  ): Promise<SlideGenerationResult> {
    const client = this.getClient(options.userApiKey);
    
    if (!client) {
      throw new Error('OpenAI provider is not available - no valid API key configured');
    }
    const prompt = PromptTemplates.buildPrompt({ ...context, slideType });
    const model = options.model || this.DEFAULT_MODEL;

    try {
      this.logger.log(`Generating ${slideType} slide with ${model}`);

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: PromptTemplates.SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: options.maxTokens || 1200,
        temperature: options.temperature || 0.7,
      });

      if (!response || !response.choices || response.choices.length === 0) {
        throw new Error('Invalid response from OpenAI API');
      }

      const content = response.choices[0]?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;

      if (!content.trim()) {
        throw new Error('Empty response from OpenAI API');
      }

      // Parse the structured response
      const parsed = this.parseSlideResponse(content, slideType);

      if (!parsed || !parsed.title || !parsed.content) {
        throw new Error('Failed to parse OpenAI response');
      }

      return {
        ...parsed,
        confidence: this.calculateConfidence(content, tokensUsed),
        model,
        tokensUsed,
      };
    } catch (error) {
      this.logger.error(`OpenAI generation failed for ${slideType}:`, error);

      // Retry with fallback model if primary model fails
      if (model === this.DEFAULT_MODEL && (options.retryCount || 0) < 1) {
        this.logger.log(`Retrying with fallback model: ${this.FALLBACK_MODEL}`);
        return this.generateSlideContent(slideType, context, {
          ...options,
          model: this.FALLBACK_MODEL,
          retryCount: (options.retryCount || 0) + 1,
        });
      }

      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  async generateFreeFormDeck(prompt: string, options: GenerationOptions = {}): Promise<any[]> {
    const client = this.getClient(options.userApiKey);
    const fullPrompt = PromptTemplates.buildFreeFormPrompt(prompt);
    const model = options.model || this.DEFAULT_MODEL;

    try {
      this.logger.log(`Generating free-form deck with ${model}`);

      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: PromptTemplates.SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        max_tokens: options.maxTokens || 8000,
        temperature: options.temperature || 0.7,
      });

      if (!response || !response.choices || response.choices.length === 0) {
        throw new Error('Invalid response from OpenAI API');
      }

      const content = response.choices[0]?.message?.content || '';
      
      if (!content.trim()) {
        throw new Error('Empty response from OpenAI API');
      }

      const slides = this.parseDeckResponse(content);
      
      if (!slides || !Array.isArray(slides) || slides.length === 0) {
        throw new Error('Failed to parse deck slides from OpenAI response');
      }

      return slides;
    } catch (error) {
      this.logger.error('OpenAI free-form generation failed:', error);
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  async generateChatResponse(
    userMessage: string,
    deckContext: any,
    slideContext?: any,
    options: GenerationOptions = {}
  ): Promise<string> {
    const client = this.getClient(options.userApiKey);
    const prompt = PromptTemplates.buildChatbotPrompt(userMessage, deckContext, slideContext);

    try {
      const response = await client.chat.completions.create({
        model: options.model || this.FALLBACK_MODEL, // Use cheaper model for chat
        messages: [
          {
            role: 'system',
            content: PromptTemplates.SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: options.maxTokens || 800,
        temperature: options.temperature || 0.8,
      });

      if (!response || !response.choices || response.choices.length === 0) {
        return 'I apologize, but I could not generate a response due to an API error.';
      }

      const content = response.choices[0]?.message?.content;
      
      if (!content || !content.trim()) {
        return 'I apologize, but I could not generate a response.';
      }

      return content;
    } catch (error) {
      this.logger.error('OpenAI chat generation failed:', error);
      throw new Error(`Chat generation failed: ${error.message}`);
    }
  }

  async getStatus(): Promise<'available' | 'unavailable' | 'quota_exceeded'> {
    if (!this.defaultApiKey) {
      return 'unavailable';
    }

    try {
      await this.openai.chat.completions.create({
        model: this.FALLBACK_MODEL,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      return 'available';
    } catch (error) {
      this.logger.warn('OpenAI status check failed:', error.message);
      if (error.status === 429) {
        return 'quota_exceeded';
      }
      return 'unavailable';
    }
  }

  private getClient(userApiKey?: string): OpenAI {
    if (userApiKey) {
      return new OpenAI({ apiKey: userApiKey });
    }
    if (!this.openai) {
      throw new Error('OpenAI not configured - missing API key');
    }
    return this.openai;
  }

  private parseSlideResponse(content: string, slideType: SlideType): Omit<SlideGenerationResult, 'confidence' | 'model' | 'tokensUsed'> {
    // Extract title and content from the AI response
    const titleMatch = content.match(/Title:\s*(.+)/i);
    const contentMatch = content.match(/Content:\s*([\s\S]+?)(?=\n\n|\nSpeaker Notes:|\nImpact:|\nBenefits:|\nGrowth:|\nTiming:|\nDifferentiation:|\nStatus:|\nEconomics:|\nValidation:|\nChannels:|\nPartnerships:|\nAdvantages:|\nBarriers:|\nExpertise:|\nAdvisors:|\nAssumptions:|\nProfitability:|\nCustomers:|\nMilestones:|\nReturns:|$)/i);

    // Extract speaker notes if present
    const speakerNotesMatch = content.match(/Speaker Notes:\s*([\s\S]+?)(?=\n\n|$)/i);

    return {
      title: titleMatch?.[1]?.trim() || this.getDefaultTitle(slideType),
      content: contentMatch?.[1]?.trim() || content.trim(),
      speakerNotes: speakerNotesMatch?.[1]?.trim(),
    };
  }

  private parseDeckResponse(content: string): any[] {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const slides = [];
    const slideMatches = content.match(/SLIDE \d+:[\s\S]*?(?=SLIDE \d+:|$)/gi);

    if (slideMatches && slideMatches.length > 0) {
      slideMatches.forEach((slideText, index) => {
        if (!slideText || typeof slideText !== 'string') {
          return;
        }

        const typeMatch = slideText.match(/SLIDE \d+:\s*(.+)/i);
        const titleMatch = slideText.match(/Title:\s*(.+)/i);
        const contentMatch = slideText.match(/Content:\s*([\s\S]+?)(?=---|$)/i);

        const title = titleMatch?.[1]?.trim() || `Slide ${index + 1}`;
        const slideContent = contentMatch?.[1]?.trim() || '';

        // Only add slides with meaningful content
        if (title && slideContent) {
          slides.push({
            slideOrder: index,
            slideType: this.mapSlideTypeName(typeMatch?.[1] || ''),
            title,
            content: slideContent,
          });
        }
      });
    }

    return slides;
  }

  private calculateConfidence(content: string, tokensUsed: number): number {
    // Simple confidence calculation based on content quality indicators
    let confidence = 0.5;

    if (content.length > 100) confidence += 0.1;
    if (content.includes('•') || content.includes('-')) confidence += 0.1;
    if (tokensUsed > 200) confidence += 0.1;
    if (content.match(/\d+%|\$[\d,]+|[\d,]+\s*(million|billion)/i)) confidence += 0.2;

    return Math.min(1.0, confidence);
  }

  private getDefaultTitle(slideType: SlideType): string {
    const titleMap = {
      cover: 'Company Overview',
      problem: 'The Problem We\'re Solving',
      solution: 'Our Solution',
      market: 'Market Opportunity',
      product: 'Product Overview',
      business_model: 'Business Model',
      go_to_market: 'Go-to-Market Strategy',
      competition: 'Competitive Landscape',
      team: 'Our Team',
      financials: 'Financial Projections',
      traction: 'Traction & Milestones',
      funding_ask: 'Funding Ask'
    };
    return titleMap[slideType] || 'Slide Title';
  }

  private mapSlideTypeName(typeName: string): SlideType {
    const typeMap: Record<string, SlideType> = {
      'cover': 'cover',
      'problem': 'problem',
      'solution': 'solution',
      'market': 'market',
      'product': 'product',
      'business model': 'business_model',
      'go-to-market': 'go_to_market',
      'competition': 'competition',
      'team': 'team',
      'financials': 'financials',
      'traction': 'traction',
      'funding': 'funding_ask'
    };

    const normalized = typeName.toLowerCase().trim();
    return typeMap[normalized] || 'cover';
  }
}
