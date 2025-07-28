import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRequestDto, ImproveSpeakerNotesDto } from './dto/chat-request.dto';
import { ChatContext } from '../entities/chat-context.entity';
import { DecksService } from '../decks/decks.service';
import { SlidesService } from '../slides/slides.service';
import { AiProviderService } from '../ai/ai-provider.service';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectRepository(ChatContext)
    private chatRepository: Repository<ChatContext>,
    private decksService: DecksService,
    private slidesService: SlidesService,
    private aiProviderService: AiProviderService,
  ) {}

  async chatWithAI(chatDto: ChatRequestDto, userId: string) {
    // Verify deck ownership
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
    const conversation = this.chatRepository.create({
      userId,
      deckId: chatDto.deckId,
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
}
