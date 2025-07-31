import { Test, TestingModule } from '@nestjs/testing';
import { GenerationService } from '../generation.service';
import { SlidesService } from '../../slides/slides.service';
import { DecksService } from '../../decks/decks.service';
import { AiProviderService } from '../../ai/ai-provider.service';
import { ContextTracker } from '../../context/context-tracker.service';
import { RegenerateSlideDto } from '../dto/regenerate-slide.dto';

describe('Slide Regeneration', () => {
  let service: GenerationService;
  let slidesService: SlidesService;
  let decksService: DecksService;
  let aiProviderService: AiProviderService;
  let contextTracker: ContextTracker;

  const mockSlidesService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockDecksService = {
    findOne: jest.fn(),
  };

  const mockAiProviderService = {
    generateSlideContent: jest.fn(),
  };

  const mockContextTracker = {
    trackUserAction: jest.fn(),
    getEnhancedPrompt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerationService,
        {
          provide: SlidesService,
          useValue: mockSlidesService,
        },
        {
          provide: DecksService,
          useValue: mockDecksService,
        },
        {
          provide: AiProviderService,
          useValue: mockAiProviderService,
        },
        {
          provide: ContextTracker,
          useValue: mockContextTracker,
        },
      ],
    }).compile();

    service = module.get<GenerationService>(GenerationService);
    slidesService = module.get<SlidesService>(SlidesService);
    decksService = module.get<DecksService>(DecksService);
    aiProviderService = module.get<AiProviderService>(AiProviderService);
    contextTracker = module.get<ContextTracker>(ContextTracker);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('regenerateSlide', () => {
    const slideId = 'slide-123';
    const userId = 'user-456';
    const deckId = 'deck-789';

    const mockSlide = {
      id: slideId,
      deckId: deckId,
      title: 'Problem Statement',
      content: 'Current problem content',
      speakerNotes: 'Current notes',
      slideType: 'problem',
    };

    const mockDeck = {
      id: deckId,
      projectId: 'project-123',
      title: 'Test Deck',
      mode: 'free',
    };

    it('should successfully regenerate slide with Groq provider', async () => {
      const regenerateDto: RegenerateSlideDto = {
        modelChoice: 'groq',
        userFeedback: 'Make it more compelling',
      };

      const mockEnhancedPrompt = {
        enhancedPrompt: 'Enhanced prompt for problem slide',
        confidenceScore: 0.85,
      };

      const mockAiResult = {
        success: true,
        content: {
          title: 'Enhanced Problem Statement',
          content: 'Enhanced problem content',
          speakerNotes: 'Enhanced speaker notes',
        },
        provider: 'groq',
      };

      const mockUpdatedSlide = {
        ...mockSlide,
        title: mockAiResult.content.title,
        content: mockAiResult.content.content,
        speakerNotes: mockAiResult.content.speakerNotes,
        generatedBy: 'groq',
      };

      mockSlidesService.findOne.mockResolvedValue(mockSlide);
      mockDecksService.findOne.mockResolvedValue(mockDeck);
      mockContextTracker.getEnhancedPrompt.mockResolvedValue(mockEnhancedPrompt);
      mockAiProviderService.generateSlideContent.mockResolvedValue(mockAiResult);
      mockSlidesService.update.mockResolvedValue(mockUpdatedSlide);
      mockContextTracker.trackUserAction.mockResolvedValue(undefined);

      const result = await service.regenerateSlide(slideId, regenerateDto, userId);

      expect(mockSlidesService.findOne).toHaveBeenCalledWith(slideId, userId);
      expect(mockDecksService.findOne).toHaveBeenCalledWith(deckId, userId);
      expect(mockAiProviderService.generateSlideContent).toHaveBeenCalledWith(
        mockSlide.slideType,
        expect.any(Object),
        {
          model: 'groq',
          userApiKey: undefined,
        }
      );
      expect(mockSlidesService.update).toHaveBeenCalledWith(slideId, {
        title: mockAiResult.content.title,
        content: mockAiResult.content.content,
        speakerNotes: mockAiResult.content.speakerNotes,
        generatedBy: 'groq',
      }, userId);
      expect(result).toEqual(mockUpdatedSlide);
    });

    it('should use default Groq model when no model specified', async () => {
      const regenerateDto: RegenerateSlideDto = {
        userFeedback: 'Improve clarity',
      };

      const mockAiResult = {
        success: true,
        content: {
          title: 'Improved Title',
          content: 'Improved content',
          speakerNotes: 'Improved notes',
        },
        provider: 'groq',
      };

      mockSlidesService.findOne.mockResolvedValue(mockSlide);
      mockDecksService.findOne.mockResolvedValue(mockDeck);
      mockContextTracker.getEnhancedPrompt.mockResolvedValue({
        enhancedPrompt: 'Enhanced prompt',
        confidenceScore: 0.8,
      });
      mockAiProviderService.generateSlideContent.mockResolvedValue(mockAiResult);
      mockSlidesService.update.mockResolvedValue(mockSlide);

      await service.regenerateSlide(slideId, regenerateDto, userId);

      expect(mockAiProviderService.generateSlideContent).toHaveBeenCalledWith(
        mockSlide.slideType,
        expect.any(Object),
        {
          model: undefined, // Should default to Groq in AI provider service
          userApiKey: undefined,
        }
      );
    });

    it('should throw error when AI generation fails', async () => {
      const regenerateDto: RegenerateSlideDto = {
        modelChoice: 'groq',
        userFeedback: 'Improve it',
      };

      const mockAiResult = {
        success: false,
        error: 'AI generation failed',
      };

      mockSlidesService.findOne.mockResolvedValue(mockSlide);
      mockDecksService.findOne.mockResolvedValue(mockDeck);
      mockContextTracker.getEnhancedPrompt.mockResolvedValue({
        enhancedPrompt: 'Enhanced prompt',
        confidenceScore: 0.8,
      });
      mockAiProviderService.generateSlideContent.mockResolvedValue(mockAiResult);

      await expect(service.regenerateSlide(slideId, regenerateDto, userId)).rejects.toThrow('AI regeneration failed');
    });

    it('should track user action for regeneration', async () => {
      const regenerateDto: RegenerateSlideDto = {
        modelChoice: 'groq',
        userFeedback: 'Make it better',
      };

      const mockAiResult = {
        success: true,
        content: {
          title: 'New Title',
          content: 'New content',
          speakerNotes: 'New notes',
        },
        provider: 'groq',
      };

      mockSlidesService.findOne.mockResolvedValue(mockSlide);
      mockDecksService.findOne.mockResolvedValue(mockDeck);
      mockContextTracker.getEnhancedPrompt.mockResolvedValue({
        enhancedPrompt: 'Enhanced prompt',
        confidenceScore: 0.9,
      });
      mockAiProviderService.generateSlideContent.mockResolvedValue(mockAiResult);
      mockSlidesService.update.mockResolvedValue(mockSlide);

      await service.regenerateSlide(slideId, regenerateDto, userId);

      expect(mockContextTracker.trackUserAction).toHaveBeenCalledWith({
        userId,
        projectId: mockDeck.projectId,
        deckId: mockSlide.deckId,
        slideId,
        actionType: 'ai_generation',
        actionData: {
          slideType: mockSlide.slideType,
          regeneration: true,
          userFeedback: regenerateDto.userFeedback,
          modelUsed: regenerateDto.modelChoice,
          enhancementConfidence: 0.9,
        },
        timestamp: expect.any(Date),
      });
    });

    it('should handle slide not found error', async () => {
      const regenerateDto: RegenerateSlideDto = {
        modelChoice: 'groq',
      };

      mockSlidesService.findOne.mockRejectedValue(new Error('Slide not found'));

      await expect(service.regenerateSlide(slideId, regenerateDto, userId)).rejects.toThrow('Slide not found');
    });
  });
});
