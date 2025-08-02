import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PromptTemplates, PromptContext } from '../prompts/prompt-templates';
import { SlideType } from '../../entities/slide.entity';
import { GenerationOptions, SlideGenerationResult } from './openai.provider';

@Injectable()
export class OllamaProvider {
  private readonly logger = new Logger(OllamaProvider.name);
  private baseUrl: string;
  private defaultModel: string;
  private availableModels: Record<string, string> = {
    'llama3.1-8b': 'llama3.1:8b',
    'llama3.1-70b': 'llama3.1:70b',
    'llama3.1-instruct': 'llama3.1:instruct'
  };
  private fallbackModel = 'llama3.1:8b';
  private enabled: boolean;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
    this.defaultModel = this.configService.get<string>('OLLAMA_DEFAULT_MODEL') || 'llama3.1:8b';
    this.enabled = this.configService.get<string>('OLLAMA_ENABLED') === 'true';
    
    // Log configuration
    this.logger.log(`Ollama configured with base URL: ${this.baseUrl}`);
    this.logger.log(`Ollama enabled: ${this.enabled}`);
    this.logger.log(`Ollama default model: ${this.defaultModel}`);
  }

  async generateSlideContent(
    slideType: SlideType,
    context: PromptContext,
    options: GenerationOptions = {}
  ): Promise<SlideGenerationResult> {
    if (!this.enabled) {
      throw new Error('Ollama is disabled in configuration');
    }
    
    const prompt = PromptTemplates.buildPrompt({ ...context, slideType });
    const fullPrompt = this.buildPrompt(prompt);
    
    // Map frontend model ID to actual Ollama model name
    let modelName = this.defaultModel;
    if (options.model) {
      if (options.model.startsWith('llama3.1-')) {
        // Convert from frontend model ID to Ollama model name
        modelName = this.availableModels[options.model] || this.defaultModel;
      } else if (options.model.includes(':')) {
        // Direct model name specification
        modelName = options.model;
      }
    }

    try {
      this.logger.log(`Generating ${slideType} slide with Ollama model: ${modelName}`);

      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: modelName,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: 0.9,
          num_predict: options.maxTokens || 1200,
        },
      }, {
        timeout: 60000, // 60 second timeout
      });

      if (!response || !response.data || typeof response.data.response !== 'string') {
        throw new Error('Invalid response from Ollama API');
      }

      const content = response.data.response || '';

      if (!content.trim()) {
        throw new Error('Empty response from Ollama API');
      }

      // Parse the structured response
      const parsed = this.parseSlideResponse(content, slideType);

      if (!parsed || !parsed.title || !parsed.content) {
        throw new Error('Failed to parse Ollama response');
      }

      return {
        ...parsed,
        confidence: this.calculateConfidence(content),
        model: `ollama:${modelName}`,
        tokensUsed: this.estimateTokens(content),
      };
    } catch (error) {
      this.logger.error(`Ollama generation failed for ${slideType}:`, error);

      // Retry with fallback model if primary model fails
      if (modelName === this.defaultModel && (options.retryCount || 0) < 1) {
        this.logger.log(`Retrying with fallback model: ${this.fallbackModel}`);
        return this.generateSlideContent(slideType, context, {
          ...options,
          model: this.fallbackModel,
          retryCount: (options.retryCount || 0) + 1,
        });
      }

      throw new Error(`Ollama generation failed: ${error.message}`);
    }
  }

  async generateFreeFormDeck(prompt: string, options: GenerationOptions = {}): Promise<any[]> {
    if (!this.enabled) {
      throw new Error('Ollama is disabled in configuration');
    }
    
    const fullPrompt = PromptTemplates.buildFreeFormPrompt(prompt);
    const systemPrompt = this.buildPrompt(fullPrompt);
    
    // Map frontend model ID to actual Ollama model name
    let modelName = this.defaultModel;
    if (options.model) {
      if (options.model.startsWith('llama3.1-')) {
        // Convert from frontend model ID to Ollama model name
        modelName = this.availableModels[options.model] || this.defaultModel;
      } else if (options.model.includes(':')) {
        // Direct model name specification
        modelName = options.model;
      }
    }

    try {
      this.logger.log(`Generating free-form deck with Ollama model: ${modelName}`);
      this.logger.log(`Ollama URL: ${this.baseUrl}/api/generate`);
      this.logger.log(`Prompt length: ${systemPrompt.length} characters`);

      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: modelName,
        prompt: systemPrompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: 0.9,
          num_predict: options.maxTokens || 8000,
        },
      }, {
        timeout: 60000, // 1 minute timeout for testing
      });

      if (!response || !response.data || typeof response.data.response !== 'string') {
        throw new Error('Invalid response from Ollama API');
      }

      this.logger.log(`Ollama response received, length: ${response.data.response?.length || 0}`);
      const content = response.data.response || '';
      
      if (!content.trim()) {
        throw new Error('Empty response from Ollama API');
      }

      const parsedSlides = this.parseDeckResponse(content);
      
      if (!parsedSlides || !Array.isArray(parsedSlides) || parsedSlides.length === 0) {
        throw new Error('Failed to parse deck slides from Ollama response');
      }

      this.logger.log(`Parsed ${parsedSlides.length} slides from Ollama response`);
      return parsedSlides;
    } catch (error) {
      this.logger.error('Ollama free-form generation failed:', error);
      throw new Error(`Ollama generation failed: ${error.message}`);
    }
  }

  async generateChatResponse(
    userMessage: string,
    deckContext: any,
    slideContext?: any,
    options: GenerationOptions = {}
  ): Promise<string> {
    if (!this.enabled) {
      throw new Error('Ollama is disabled in configuration');
    }
    
    const prompt = PromptTemplates.buildChatbotPrompt(userMessage, deckContext, slideContext);
    const fullPrompt = this.buildPrompt(prompt);
    
    // Map frontend model ID to actual Ollama model name
    let modelName = this.defaultModel;
    if (options.model) {
      if (options.model.startsWith('llama3.1-')) {
        // Convert from frontend model ID to Ollama model name
        modelName = this.availableModels[options.model] || this.defaultModel;
      } else if (options.model.includes(':')) {
        // Direct model name specification
        modelName = options.model;
      }
    }

    try {
      this.logger.log(`Generating chat response with Ollama model: ${modelName}`);
      
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: modelName,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.8,
          top_p: 0.9,
          num_predict: options.maxTokens || 800,
        },
      }, {
        timeout: 30000, // 30 second timeout for chat
      });

      if (!response || !response.data || typeof response.data.response !== 'string') {
        return 'I apologize, but I could not generate a response due to an API error.';
      }

      const content = response.data.response;
      
      if (!content || !content.trim()) {
        return 'I apologize, but I could not generate a response.';
      }

      return content;
    } catch (error) {
      this.logger.error('Ollama chat generation failed:', error);
      throw new Error(`Chat generation failed: ${error.message}`);
    }
  }

  async getStatus(): Promise<'available' | 'unavailable' | 'quota_exceeded'> {
    if (!this.enabled) {
      return 'unavailable';
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000,
      });

      const models = response.data.models || [];
      this.logger.log(`Found ${models.length} Ollama models: ${models.map(m => m.name).join(', ')}`);
      
      // Check for each of our supported models
      const availableModels = models.map(m => m.name);
      
      // Check if any of our supported models are available
      const supportedModels = Object.values(this.availableModels);
      const hasAnySupportedModel = supportedModels.some(modelName => 
        availableModels.some(m => m.includes(modelName))
      );

      return hasAnySupportedModel ? 'available' : 'unavailable';
    } catch (error) {
      this.logger.warn('Ollama status check failed:', error.message);
      return 'unavailable';
    }
  }

  private buildPrompt(userPrompt: string): string {
    return `${PromptTemplates.SYSTEM_PROMPT}

${userPrompt}

Please provide a detailed, professional response:`;
  }

  async ensureModelAvailable(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      const models = response.data.models || [];

      if (!models.some(m => m.name === this.defaultModel)) {
        this.logger.warn(`Model ${this.defaultModel} not available in Ollama`);
        // Try to pull the model
        await this.pullModel();
      }
    } catch (error) {
      this.logger.warn('Ollama not available:', error.message);
    }
  }

  private async pullModel(): Promise<void> {
    try {
      this.logger.log(`Attempting to pull model: ${this.defaultModel}`);
      await axios.post(`${this.baseUrl}/api/pull`, {
        name: this.defaultModel,
      }, {
        timeout: 300000, // 5 minute timeout for model pull
      });
      this.logger.log(`Successfully pulled model: ${this.defaultModel}`);
    } catch (error) {
      this.logger.error(`Failed to pull model ${this.defaultModel}:`, error.message);
    }
  }

  private parseSlideResponse(content: string, slideType: SlideType): Omit<SlideGenerationResult, 'confidence' | 'model' | 'tokensUsed'> {
    // Similar parsing logic to OpenAI but adapted for Ollama's response format
    const titleMatch = content.match(/Title:\s*(.+)/i) || content.match(/^(.+)$/m);
    const contentMatch = content.match(/Content:\s*([\s\S]+?)(?=\n\n|\nSpeaker Notes:|$)/i);
    const speakerNotesMatch = content.match(/Speaker Notes:\s*([\s\S]+?)(?=\n\n|$)/i);

    // If no structured format, treat the whole response as content
    let title = titleMatch?.[1]?.trim() || this.getDefaultTitle(slideType);
    let slideContent = contentMatch?.[1]?.trim() || content.trim();

    // Clean up the content
    slideContent = slideContent.replace(/^(Title:|Content:)/gmi, '').trim();

    return {
      title,
      content: slideContent,
      speakerNotes: speakerNotesMatch?.[1]?.trim(),
    };
  }

  private parseDeckResponse(content: string): any[] {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const slides = [];

    // Try to parse structured format first
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
    } else {
      // Fallback: split by common slide indicators
      const sections = content.split(/(?=\d+\.\s|(?:Cover|Problem|Solution|Market|Product|Business|Team|Financial|Traction|Funding))/i);

      sections.forEach((section, index) => {
        if (section && typeof section === 'string' && section.trim()) {
          const lines = section.trim().split('\n');
          const title = lines[0]?.replace(/^\d+\.\s*/, '').trim() || `Slide ${index + 1}`;
          const slideContent = lines.slice(1).join('\n').trim();

          // Only add slides with meaningful content
          if (title && slideContent) {
            slides.push({
              slideOrder: index,
              slideType: this.inferSlideType(title),
              title,
              content: slideContent,
            });
          }
        }
      });
    }

    return slides.filter(slide => slide && slide.title && slide.content);
  }

  private calculateConfidence(content: string): number {
    // Confidence calculation for Ollama responses
    let confidence = 0.4; // Start lower than OpenAI

    if (content.length > 100) confidence += 0.1;
    if (content.includes('•') || content.includes('-') || content.includes('*')) confidence += 0.1;
    if (content.match(/\d+%|\$[\d,]+|[\d,]+\s*(million|billion)/i)) confidence += 0.2;
    if (content.includes('Title:') && content.includes('Content:')) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  private estimateTokens(content: string): number {
    // Rough token estimation (1 token ≈ 4 characters)
    return Math.ceil(content.length / 4);
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

  private inferSlideType(title: string): SlideType {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('cover') || titleLower.includes('overview')) return 'cover';
    if (titleLower.includes('problem')) return 'problem';
    if (titleLower.includes('solution')) return 'solution';
    if (titleLower.includes('market')) return 'market';
    if (titleLower.includes('product')) return 'product';
    if (titleLower.includes('business') || titleLower.includes('model')) return 'business_model';
    if (titleLower.includes('go-to-market') || titleLower.includes('marketing')) return 'go_to_market';
    if (titleLower.includes('competition') || titleLower.includes('competitive')) return 'competition';
    if (titleLower.includes('team')) return 'team';
    if (titleLower.includes('financial') || titleLower.includes('revenue')) return 'financials';
    if (titleLower.includes('traction') || titleLower.includes('milestone')) return 'traction';
    if (titleLower.includes('funding') || titleLower.includes('investment')) return 'funding_ask';

    return 'cover';
  }
}
