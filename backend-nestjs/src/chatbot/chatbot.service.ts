import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRequestDto, ImproveSpeakerNotesDto } from './dto/chat-request.dto';
import { ChatContext } from '../entities/chat-context.entity';
import { PitchDeck } from '../entities/pitch-deck.entity';
import { Presentation } from '../entities/presentation.entity';
import { DecksService } from '../decks/decks.service';
import { SlidesService } from '../slides/slides.service';
import { ProjectsService } from '../projects/projects.service';
import { PresentationsService } from '../presentations/presentations.service';
import { AiProviderService } from '../ai/ai-provider.service';
import {
  isVirtualDashboardDeck,
  validateVirtualDeckOwnership
} from '../utils/virtual-decks';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectRepository(ChatContext)
    private chatRepository: Repository<ChatContext>,
    @InjectRepository(PitchDeck)
    private deckRepository: Repository<PitchDeck>,
    @InjectRepository(Presentation)
    private presentationRepository: Repository<Presentation>,
    private decksService: DecksService,
    private slidesService: SlidesService,
    private projectsService: ProjectsService,
    private presentationsService: PresentationsService,
    private aiProviderService: AiProviderService,
  ) {}

  async chatWithAI(chatDto: ChatRequestDto, userId: string) {
    console.log('🔍 chatWithAI called with:', {
      deckId: chatDto.deckId,
      userId,
      message: chatDto.message?.substring(0, 50) + '...'
    });

    // Check if this is a virtual dashboard deck
    const isVirtual = isVirtualDashboardDeck(chatDto.deckId, userId);
    console.log('🔍 Virtual deck check:', { isVirtual, deckId: chatDto.deckId, userId });

    if (isVirtual) {
      // Validate that the virtual deck belongs to the requesting user
      const isValidOwnership = validateVirtualDeckOwnership(chatDto.deckId, userId);
      console.log('🔍 Virtual deck ownership:', { isValidOwnership });

      if (!isValidOwnership) {
        throw new UnauthorizedException('Cannot access another user\'s dashboard conversations');
      }

      // Handle dashboard conversation
      console.log('🔍 Handling dashboard conversation');
      return this.handleDashboardConversation(chatDto, userId);
    }

    // Real deck conversation - verify ownership
    const deck = await this.decksService.verifyDeckOwnership(chatDto.deckId, userId);

    // Get slide context if specified
    let slideContext = null;
    if (chatDto.slideId) {
      slideContext = await this.slidesService.findOne(chatDto.slideId, userId);
    }

    // Generate AI response
    const result = await this.aiProviderService.generateChatResponse(
      chatDto.message,
      deck,
      slideContext,
      { model: 'openai' } // Use OpenAI for better chat responses
    );

    if (!result.success) {
      throw new Error(result.error || 'Chat generation failed');
    }

    // Save conversation
    await this.saveConversation(chatDto, result.content, userId);

    return {
      message: result.content,
      suggestions: this.generateSuggestions(chatDto, deck, slideContext),
      contextUsed: chatDto.context,
      provider: result.provider,
    };
  }

  async improveSpeakerNotes(improveDto: ImproveSpeakerNotesDto, userId: string) {
    // Verify slide ownership
    const slide = await this.slidesService.findOne(improveDto.slideId, userId);

    const improvementPrompts = {
      'clarity': 'Make these speaker notes clearer and more concise while maintaining all key points',
      'engagement': 'Make these speaker notes more engaging and persuasive for investor presentations',
      'structure': 'Improve the structure and flow of these speaker notes for better delivery',
      'detail': 'Add more specific details, examples, and data points to these speaker notes'
    };

    const prompt = `${improvementPrompts[improveDto.improvementType] || improvementPrompts.clarity}:

    Slide Title: "${slide.title}"
    Slide Type: ${slide.slideType}
    Slide Content: "${slide.content}"
    Current Speaker Notes: "${improveDto.currentNotes}"

    Please provide improved speaker notes that:
    - Support the slide content effectively
    - Are appropriate for investor presentations
    - Include specific talking points and transitions
    - Maintain professional tone

    Improved Speaker Notes:`;

    const result = await this.aiProviderService.generateChatResponse(
      prompt,
      { title: slide.title, slideType: slide.slideType },
      slide,
      { model: 'openai' }
    );

    if (!result.success) {
      throw new Error(result.error || 'Speaker notes improvement failed');
    }

    return {
      improvedNotes: result.content,
      originalNotes: improveDto.currentNotes,
      improvementType: improveDto.improvementType,
      slideTitle: slide.title,
      provider: result.provider,
    };
  }

  private buildScriptWritingPrompt(chatDto: ChatRequestDto): string {
    return `You are an expert pitch deck consultant helping entrepreneurs refine their investor presentations.
    
    Current context:
    - Deck ID: ${chatDto.deckId}
    - Slide ID: ${chatDto.slideId || 'General deck discussion'}
    - Context: ${JSON.stringify(chatDto.context || {})}
    
    Your role is to:
    1. Help improve pitch content for investor appeal
    2. Suggest better phrasing and structure
    3. Provide specific, actionable advice
    4. Focus on clarity, persuasion, and professional presentation
    
    Always provide concrete, specific suggestions rather than generic advice.`;
  }

  private generateSuggestions(chatDto: ChatRequestDto, deck?: any, slide?: any): string[] {
    const suggestions = [];

    if (slide) {
      suggestions.push(`Would you like me to help improve the speaker notes for the "${slide.title}" slide?`);
      suggestions.push(`I can suggest ways to make the ${slide.slideType} content more compelling`);
      suggestions.push(`Would you like me to review how this slide fits in your overall pitch flow?`);
    } else {
      suggestions.push("Would you like me to review the overall structure of your pitch deck?");
      suggestions.push("I can help you improve specific slides or content areas");
      suggestions.push("Would you like suggestions for making your pitch more investor-friendly?");
    }

    // Add context-specific suggestions
    if (deck?.mode === 'custom') {
      suggestions.push("I can help you strengthen your value proposition based on your form data");
    }

    return suggestions.slice(0, 3); // Return max 3 suggestions
  }

  private async saveConversation(chatDto: ChatRequestDto, response: string, userId: string): Promise<void> {
    let deckIdToSave = chatDto.deckId;

    // For virtual decks, ensure we have a valid deck record to reference
    if (isVirtualDashboardDeck(chatDto.deckId, userId)) {
      console.log('🔍 Creating/finding virtual deck record for database save');
      deckIdToSave = await this.ensureVirtualDeckExists(chatDto.deckId, userId);
    }

    const conversation = this.chatRepository.create({
      userId,
      deckId: deckIdToSave,
      slideId: chatDto.slideId,
      conversationData: {
        messages: [
          {
            role: 'user',
            content: chatDto.message,
            timestamp: new Date(),
          },
          {
            role: 'assistant',
            content: response,
            timestamp: new Date(),
          },
        ],
      },
      contextUsed: chatDto.context,
    });

    await this.chatRepository.save(conversation);
  }

  /**
   * Ensure a virtual deck record exists in the database for foreign key constraint
   */
  private async ensureVirtualDeckExists(virtualDeckId: string, userId: string): Promise<string> {
    try {
      // Check if virtual deck already exists by querying directly
      const existingDeck = await this.deckRepository.findOne({
        where: { id: virtualDeckId }
      });

      if (existingDeck) {
        return virtualDeckId;
      }
    } catch (error) {
      // Deck doesn't exist, we'll create it
    }

    // Create a virtual presentation first
    const virtualPresentation = await this.ensureVirtualPresentationExists(userId);

    // Create the virtual deck record directly with the specific UUID
    const virtualDeck = this.deckRepository.create({
      id: virtualDeckId,
      projectId: virtualPresentation.projectId,
      presentationId: virtualPresentation.id,
      title: 'Dashboard Conversations',
      mode: 'free',
      generationData: {
        type: 'virtual',
        purpose: 'dashboard_conversations',
        userId: userId
      }
    });

    await this.deckRepository.save(virtualDeck);
    return virtualDeckId;
  }

  /**
   * Ensure a virtual project exists for virtual decks
   */
  private async ensureVirtualProjectExists(userId: string) {
    // Try to find existing virtual project
    const projects = await this.projectsService.findAllByUser(userId);
    const virtualProject = projects.projects.find(p => p.name === 'Virtual Dashboard Project');

    if (virtualProject) {
      return virtualProject;
    }

    // Create virtual project
    return await this.projectsService.create({
      name: 'Virtual Dashboard Project',
      description: 'System project for dashboard conversations'
    }, userId);
  }

  /**
   * Ensure a virtual presentation exists for virtual decks
   */
  private async ensureVirtualPresentationExists(userId: string) {
    // First ensure the virtual project exists
    const virtualProject = await this.ensureVirtualProjectExists(userId);

    // Try to find existing virtual presentation
    const presentations = await this.presentationsService.findAllByProject(virtualProject.id, userId);
    const virtualPresentation = presentations.find(p => p.name === 'Dashboard Conversations');

    if (virtualPresentation) {
      return virtualPresentation;
    }

    // Create virtual presentation
    return await this.presentationsService.create({
      projectId: virtualProject.id,
      name: 'Dashboard Conversations',
      description: 'Virtual presentation for dashboard AI conversations'
    }, userId);
  }

  /**
   * Handle dashboard conversation (virtual deck)
   */
  private async handleDashboardConversation(chatDto: ChatRequestDto, userId: string) {
    // Generate AI response for general pitch deck guidance
    const result = await this.aiProviderService.generateChatResponse(
      chatDto.message,
      null, // No deck context
      null, // No slide context
      { model: 'groq' } // Use Groq as default for chat responses
    );

    if (!result.success) {
      throw new Error(result.error || 'Dashboard chat generation failed');
    }

    // Save conversation with virtual deck ID
    await this.saveConversation(chatDto, result.content, userId);

    return {
      message: result.content,
      suggestions: this.generateDashboardSuggestions(),
      contextUsed: chatDto.context,
      provider: result.provider,
    };
  }

  /**
   * Generate suggestions for dashboard conversations
   */
  private generateDashboardSuggestions(): string[] {
    return [
      "I can help you understand the key elements of a successful pitch deck",
      "Would you like guidance on structuring your investor presentation?",
      "I can provide industry-specific insights for your pitch deck",
    ];
  }
}
