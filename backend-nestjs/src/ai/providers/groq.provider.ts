import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PromptTemplates, PromptContext } from '../prompts/prompt-templates';
import { SlideType } from '../../entities/slide.entity';
import { GenerationOptions, SlideGenerationResult } from './openai.provider';
import Groq from 'groq-sdk';

@Injectable()
export class GroqProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private groq: any;
  private enabled: boolean;
  private readonly DEFAULT_MODEL = 'llama3-70b-8192';
  private readonly FALLBACK_MODEL = 'llama3-8b-8192';
  private readonly availableModels = {
    'groq-llama-70b': 'llama3-70b-8192',
    'groq-llama-8b': 'llama3-8b-8192',
    'groq-gemma': 'gemma-7b-it'
  };

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const baseUrl = this.configService.get<string>('GROQ_BASE_URL');
    this.enabled = !!apiKey && this.configService.get<string>('GROQ_ENABLED') === 'true';
    
    if (this.enabled && apiKey) {
      this.groq = new Groq({ 
        apiKey,
        baseURL: baseUrl || 'https://api.groq.com'
      });
      this.logger.log(`Groq provider initialized with base URL: ${baseUrl || 'https://api.groq.com'}`);
    } else {
      this.logger.warn('Groq provider not initialized: missing API key or disabled');
    }
  }

  async generateSlideContent(
    slideType: SlideType,
    context: PromptContext,
    options: GenerationOptions = {}
  ): Promise<SlideGenerationResult> {
    if (!this.enabled || !this.groq) {
      throw new Error('Groq provider is not enabled or properly configured');
    }

    const prompt = PromptTemplates.buildPrompt({ ...context, slideType });
    
    // Map frontend model ID to actual Groq model name
    let modelName = this.DEFAULT_MODEL;
    if (options.model && this.availableModels[options.model]) {
      modelName = this.availableModels[options.model];
    }

    try {
      this.logger.log(`Generating ${slideType} slide with Groq model: ${modelName}`);

      const response = await this.groq.chat.completions.create({
        model: modelName,
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
        throw new Error('Invalid response from Groq API');
      }

      const content = response.choices[0]?.message?.content || '';

      if (!content.trim()) {
        throw new Error('Empty response from Groq API');
      }

      // Parse the structured response
      const parsed = this.parseSlideResponse(content, slideType);

      if (!parsed || !parsed.title || !parsed.content) {
        throw new Error('Failed to parse Groq response');
      }

      return {
        ...parsed,
        confidence: this.calculateConfidence(content),
        model: `groq:${modelName}`,
        tokensUsed: response.usage?.total_tokens || 0,
      };
    } catch (error) {
      this.logger.error(`Groq generation failed for ${slideType}:`, error);

      // Retry with fallback model if primary model fails
      if (modelName === this.DEFAULT_MODEL && (options.retryCount || 0) < 1) {
        this.logger.log(`Retrying with fallback model: ${this.FALLBACK_MODEL}`);
        return this.generateSlideContent(slideType, context, {
          ...options,
          model: 'groq-llama-8b',
          retryCount: (options.retryCount || 0) + 1,
        });
      }

      throw new Error(`Groq generation failed: ${error.message}`);
    }
  }

  async generateFreeFormDeck(prompt: string, options: GenerationOptions = {}): Promise<any[]> {
    if (!this.enabled || !this.groq) {
      throw new Error('Groq provider is not enabled or properly configured');
    }

    const fullPrompt = PromptTemplates.buildFreeFormPrompt(prompt);
    
    // Map frontend model ID to actual Groq model name
    let modelName = this.DEFAULT_MODEL;
    if (options.model && this.availableModels[options.model]) {
      modelName = this.availableModels[options.model];
    }

    try {
      this.logger.log(`Generating free-form deck with Groq model: ${modelName}`);

      const response = await this.groq.chat.completions.create({
        model: modelName,
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
        throw new Error('Invalid response from Groq API');
      }

      const content = response.choices[0]?.message?.content || '';
      
      if (!content.trim()) {
        throw new Error('Empty response from Groq API');
      }

      const slides = this.parseDeckResponse(content);
      
      if (!slides || !Array.isArray(slides) || slides.length === 0) {
        throw new Error('Failed to parse deck slides from Groq response');
      }

      return slides;
    } catch (error) {
      this.logger.error('Groq free-form generation failed:', error);
      throw new Error(`Groq generation failed: ${error.message}`);
    }
  }

  async generateChatResponse(
    userMessage: string,
    deckContext: any,
    slideContext?: any,
    options: GenerationOptions = {}
  ): Promise<string> {
    if (!this.enabled || !this.groq) {
      throw new Error('Groq provider is not enabled or properly configured');
    }

    const prompt = PromptTemplates.buildChatbotPrompt(userMessage, deckContext, slideContext);
    
    // Map frontend model ID to actual Groq model name
    let modelName = this.DEFAULT_MODEL;
    if (options.model && this.availableModels[options.model]) {
      modelName = this.availableModels[options.model];
    }

    try {
      this.logger.log(`Generating chat response with Groq model: ${modelName}`);

      const response = await this.groq.chat.completions.create({
        model: modelName,
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
      this.logger.error('Groq chat generation failed:', error);
      throw new Error(`Chat generation failed: ${error.message}`);
    }
  }

  async getStatus(): Promise<'available' | 'unavailable' | 'quota_exceeded'> {
    if (!this.enabled || !this.groq) {
      return 'unavailable';
    }

    try {
      // Simple test call to check if API key is valid
      await this.groq.chat.completions.create({
        model: this.FALLBACK_MODEL,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
      });
      return 'available';
    } catch (error) {
      this.logger.warn('Groq status check failed:', error.message);
      if (error.status === 429) {
        return 'quota_exceeded';
      }
      return 'unavailable';
    }
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

  private calculateConfidence(content: string): number {
    // Simple confidence calculation based on content quality indicators
    let confidence = 0.6; // Start higher than Ollama but lower than OpenAI

    if (content.length > 100) confidence += 0.1;
    if (content.includes('•') || content.includes('-')) confidence += 0.1;
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