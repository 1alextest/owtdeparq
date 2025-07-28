import { Injectable, Logger } from '@nestjs/common';
import { GenerateFreeDto } from './dto/generate-free.dto';
import { GenerateCustomDto } from './dto/generate-custom.dto';
import { RegenerateSlideDto } from './dto/regenerate-slide.dto';
import { PitchDeck } from '../entities/pitch-deck.entity';
import { Slide, SlideType } from '../entities/slide.entity';
import { ProjectsService } from '../projects/projects.service';
import { DecksService } from '../decks/decks.service';
import { SlidesService } from '../slides/slides.service';
import { AiProviderService } from '../ai/ai-provider.service';
import { PromptContext } from '../ai/prompts/prompt-templates';
import { RecommendationEngineService } from '../context/learning/recommendation-engine.service';
import { ContextTrackerService } from '../context/learning/context-tracker.service';

@Injectable()
export class GenerationService {
  private readonly logger = new Logger(GenerationService.name);

  constructor(
    private projectsService: ProjectsService,
    private decksService: DecksService,
    private slidesService: SlidesService,
    private aiProviderService: AiProviderService,
    private recommendationEngine: RecommendationEngineService,
    private contextTracker: ContextTrackerService,
  ) {}

  async generateFreeMode(generateDto: GenerateFreeDto, userId: string): Promise<PitchDeck> {
    this.logger.log(`Starting free mode generation for user ${userId}`);
    this.logger.log(`Project ID: ${generateDto.projectId}`);
    this.logger.log(`Prompt: ${generateDto.prompt}`);
    this.logger.log(`Preferred Model: ${generateDto.preferredModel}`);

    // Verify project ownership
    this.logger.log(`Verifying project ownership...`);
    await this.projectsService.verifyProjectOwnership(generateDto.projectId, userId);
    this.logger.log(`Project ownership verified`);

    // Create deck
    this.logger.log(`Creating deck...`);
    const deck = await this.decksService.create({
      projectId: generateDto.projectId,
      title: this.extractTitleFromPrompt(generateDto.prompt),
      mode: 'free',
      generationData: {
        prompt: generateDto.prompt,
        preferredModel: generateDto.preferredModel,
        generatedAt: new Date(),
      },
    }, userId);
    this.logger.log(`Deck created with ID: ${deck.id}`);

    try {
      // Generate full deck using AI
      this.logger.log(`Starting AI generation with model: ${generateDto.preferredModel}`);
      const result = await this.aiProviderService.generateFreeFormDeck(
        generateDto.prompt,
        {
          model: generateDto.preferredModel,
          userApiKey: generateDto.userApiKey,
        }
      );
      this.logger.log(`AI generation completed. Success: ${result.success}`);

      if (!result.success) {
        throw new Error(result.error || 'AI generation failed');
      }

      // Create slides from AI response
      const slides = await Promise.all(
        result.content.map((slideData: any, index: number) =>
          this.slidesService.create({
            deckId: deck.id,
            title: slideData.title,
            content: slideData.content,
            slideType: slideData.slideType,
            slideOrder: index,
            generatedBy: result.provider,
          }, userId)
        )
      );

      this.logger.log(`Successfully generated ${slides.length} slides for deck ${deck.id}`);

      // Return deck with slides
      return await this.decksService.findOne(deck.id, userId);
    } catch (error) {
      this.logger.error(`Free mode generation failed for deck ${deck.id}:`, error);
      // Clean up the deck if generation failed
      await this.decksService.remove(deck.id, userId);
      throw error;
    }
  }

  async generateCustomMode(generateDto: GenerateCustomDto, userId: string): Promise<PitchDeck> {
    this.logger.log(`Starting custom mode generation for user ${userId}`);

    // Verify project ownership
    await this.projectsService.verifyProjectOwnership(generateDto.projectId, userId);

    // Create deck
    const deck = await this.decksService.create({
      projectId: generateDto.projectId,
      title: `${generateDto.companyName} Pitch Deck`,
      mode: 'custom',
      generationData: {
        ...generateDto,
        generatedAt: new Date(),
      },
    }, userId);

    try {
      // Generate slides with structured data
      const slideConfigs = [
        { type: 'cover' as SlideType, data: generateDto.companyName },
        { type: 'problem' as SlideType, data: generateDto.problemStatement },
        { type: 'solution' as SlideType, data: generateDto.solution },
        { type: 'market' as SlideType, data: generateDto.targetMarket },
        { type: 'business_model' as SlideType, data: generateDto.businessModel },
        { type: 'go_to_market' as SlideType, data: generateDto.goToMarketStrategy },
        { type: 'competition' as SlideType, data: generateDto.competition },
        { type: 'team' as SlideType, data: generateDto.team },
        { type: 'financials' as SlideType, data: generateDto.financials },
        { type: 'traction' as SlideType, data: generateDto.traction },
        { type: 'funding_ask' as SlideType, data: generateDto.fundingAsk },
      ];

      const slides = await Promise.all(
        slideConfigs.map((config, index) =>
          this.generateStructuredSlideContent(
            deck.id,
            config.type,
            index,
            config.data,
            generateDto,
            userId
          )
        )
      );

      this.logger.log(`Successfully generated ${slides.length} slides for custom deck ${deck.id}`);

      // Return deck with slides
      return await this.decksService.findOne(deck.id, userId);
    } catch (error) {
      this.logger.error(`Custom mode generation failed for deck ${deck.id}:`, error);
      // Clean up the deck if generation failed
      await this.decksService.remove(deck.id, userId);
      throw error;
    }
  }

  async regenerateSlide(slideId: string, regenerateDto: RegenerateSlideDto, userId: string): Promise<Slide> {
    this.logger.log(`Regenerating slide ${slideId} for user ${userId}`);

    const slide = await this.slidesService.findOne(slideId, userId);
    const deck = await this.decksService.findOne(slide.deckId, userId);

    try {
      // Build context for regeneration with user learning
      const baseContext: PromptContext = {
        slideType: slide.slideType,
        companyName: deck.generationData?.companyName,
        industry: deck.generationData?.industry,
        targetMarket: deck.generationData?.targetMarket,
        previousContent: slide.content,
        userFeedback: regenerateDto.userFeedback,
      };

      // Enhance prompt with user learning patterns
      const enhancedPrompt = await this.recommendationEngine.enhancePromptWithContext(
        userId,
        baseContext,
        'deck',
        slide.deckId
      );

      // Apply personalization to context
      const personalizedContext = {
        ...baseContext,
        userPreferences: enhancedPrompt.adaptations,
      };

      // Generate new content with enhanced context
      const result = await this.aiProviderService.generateSlideContent(
        slide.slideType,
        personalizedContext,
        {
          model: regenerateDto.modelChoice,
          userApiKey: regenerateDto.userApiKey,
        }
      );

      // Track regeneration action
      await this.contextTracker.trackUserAction({
        userId,
        projectId: deck.projectId,
        deckId: slide.deckId,
        slideId,
        actionType: 'ai_generation',
        actionData: {
          slideType: slide.slideType,
          regeneration: true,
          userFeedback: regenerateDto.userFeedback,
          modelUsed: regenerateDto.modelChoice,
          enhancementConfidence: enhancedPrompt.confidenceScore,
        },
        timestamp: new Date(),
      });

      if (!result.success) {
        throw new Error(result.error || 'AI regeneration failed');
      }

      // Update slide with new content
      const updatedSlide = await this.slidesService.update(slideId, {
        title: result.content.title,
        content: result.content.content,
        speakerNotes: result.content.speakerNotes,
        generatedBy: result.provider,
      }, userId);

      this.logger.log(`Successfully regenerated slide ${slideId}`);
      return updatedSlide;
    } catch (error) {
      this.logger.error(`Slide regeneration failed for ${slideId}:`, error);
      throw error;
    }
  }

  private extractTitleFromPrompt(prompt: string): string {
    // Extract company name or create title from prompt
    const companyMatch = prompt.match(/(?:for|about|company|startup)\s+([A-Z][a-zA-Z\s]+)/i);
    if (companyMatch) {
      return `${companyMatch[1].trim()} Pitch Deck`;
    }

    // Fallback to first few words
    const words = prompt.split(' ').slice(0, 6);
    return words.join(' ') + ' Pitch Deck';
  }

  private async generateStructuredSlideContent(
    deckId: string,
    slideType: SlideType,
    order: number,
    data: string,
    formData: GenerateCustomDto,
    userId: string
  ): Promise<Slide> {
    // Skip slides with no data
    if (!data || data.trim() === '') {
      return null;
    }

    try {
      // Build context for structured generation
      const context: PromptContext = {
        slideType,
        companyName: formData.companyName,
        industry: formData.industry,
        targetMarket: formData.targetMarket,
      };

      // Generate content using AI
      const result = await this.aiProviderService.generateSlideContent(
        slideType,
        context,
        {
          model: formData.preferredModel,
          userApiKey: formData.userApiKey,
        }
      );

      if (!result.success) {
        this.logger.warn(`AI generation failed for ${slideType}, using fallback content`);
        // Fallback to basic content
        return await this.slidesService.create({
          deckId,
          title: this.getSlideTitle(slideType),
          content: data,
          slideType,
          slideOrder: order,
          generatedBy: 'fallback',
        }, userId);
      }

      // Create slide with AI-generated content
      return await this.slidesService.create({
        deckId,
        title: result.content.title,
        content: result.content.content,
        speakerNotes: result.content.speakerNotes,
        slideType,
        slideOrder: order,
        generatedBy: result.provider,
      }, userId);
    } catch (error) {
      this.logger.error(`Structured slide generation failed for ${slideType}:`, error);
      throw error;
    }
  }

  private getSlideTitle(slideType: SlideType): string {
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

  async testGroq(): Promise<any> {
    this.logger.log('Testing Groq provider directly');
    
    try {
      const result = await this.aiProviderService.generateFreeFormDeck(
        'Test prompt for a tech startup',
        {
          model: 'groq-llama-8b',
        }
      );

      return {
        success: result.success,
        provider: result.provider,
        model: result.model,
        contentLength: result.content?.length || 0,
        error: result.error,
      };
    } catch (error) {
      this.logger.error('Groq test failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
