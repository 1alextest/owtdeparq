import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatbotService } from '../chatbot.service';
import { ChatContext } from '../../entities/chat-context.entity';
import { PitchDeck } from '../../entities/pitch-deck.entity';
import { DecksService } from '../../decks/decks.service';
import { SlidesService } from '../../slides/slides.service';
import { ProjectsService } from '../../projects/projects.service';
import { AiProviderService } from '../../ai/ai-provider.service';
import { ChatRequestDto } from '../dto/chat-request.dto';

// Mock the virtual deck utilities
jest.mock('../../utils/virtual-decks', () => ({
  isVirtualDashboardDeck: jest.fn(),
  validateVirtualDeckOwnership: jest.fn(),
}));

// Import the mocked functions
import { isVirtualDashboardDeck, validateVirtualDeckOwnership } from '../../utils/virtual-decks';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let chatRepository: Repository<ChatContext>;
  let deckRepository: Repository<PitchDeck>;
  let decksService: DecksService;
  let slidesService: SlidesService;
  let projectsService: ProjectsService;
  let aiProviderService: AiProviderService;

  // Mock functions
  const mockIsVirtualDashboardDeck = isVirtualDashboardDeck as jest.MockedFunction<typeof isVirtualDashboardDeck>;
  const mockValidateVirtualDeckOwnership = validateVirtualDeckOwnership as jest.MockedFunction<typeof validateVirtualDeckOwnership>;

  const mockChatRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDeckRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockDecksService = {
    verifyDeckOwnership: jest.fn(),
    findOne: jest.fn(),
  };

  const mockSlidesService = {
    findOne: jest.fn(),
  };

  const mockProjectsService = {
    create: jest.fn(),
    findAllByUser: jest.fn(),
  };

  const mockAiProviderService = {
    generateChatResponse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        {
          provide: getRepositoryToken(ChatContext),
          useValue: mockChatRepository,
        },
        {
          provide: getRepositoryToken(PitchDeck),
          useValue: mockDeckRepository,
        },
        {
          provide: DecksService,
          useValue: mockDecksService,
        },
        {
          provide: SlidesService,
          useValue: mockSlidesService,
        },
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
        {
          provide: AiProviderService,
          useValue: mockAiProviderService,
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
    chatRepository = module.get<Repository<ChatContext>>(getRepositoryToken(ChatContext));
    deckRepository = module.get<Repository<PitchDeck>>(getRepositoryToken(PitchDeck));
    decksService = module.get<DecksService>(DecksService);
    slidesService = module.get<SlidesService>(SlidesService);
    projectsService = module.get<ProjectsService>(ProjectsService);
    aiProviderService = module.get<AiProviderService>(AiProviderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('chatWithAI', () => {
    const userId = 'test-user-123';
    const realDeckId = 'real-deck-456';
    const virtualDeckId = 'a4446b18-c9fb-592a-8808-16b166a802f4'; // Virtual deck UUID

    it('should handle real deck conversations', async () => {
      const chatDto: ChatRequestDto = {
        message: 'Help me improve my pitch deck',
        deckId: realDeckId,
      };

      const mockDeck = {
        id: realDeckId,
        title: 'Test Deck',
        mode: 'free',
      };

      const mockAiResponse = {
        success: true,
        content: 'Here are some suggestions for your pitch deck...',
        provider: 'openai',
      };

      // Mock virtual deck detection to return false for real deck
      mockIsVirtualDashboardDeck.mockReturnValue(false);
      mockDecksService.verifyDeckOwnership.mockResolvedValue(mockDeck);
      mockAiProviderService.generateChatResponse.mockResolvedValue(mockAiResponse);
      mockChatRepository.create.mockReturnValue({});
      mockChatRepository.save.mockResolvedValue({});

      const result = await service.chatWithAI(chatDto, userId);

      expect(mockDecksService.verifyDeckOwnership).toHaveBeenCalledWith(realDeckId, userId);
      expect(mockAiProviderService.generateChatResponse).toHaveBeenCalledWith(
        chatDto.message,
        mockDeck,
        null,
        { model: 'openai' }
      );
      expect(result.message).toBe(mockAiResponse.content);
      expect(result.provider).toBe('openai');
    });

    it('should handle virtual deck conversations', async () => {
      const chatDto: ChatRequestDto = {
        message: 'What are the key elements of a pitch deck?',
        deckId: virtualDeckId,
      };

      const mockAiResponse = {
        success: true,
        content: 'Key elements include problem, solution, market...',
        provider: 'groq',
      };

      const mockProject = {
        id: 'virtual-project-123',
        name: 'Virtual Dashboard Project',
      };

      // Mock virtual deck detection to return true
      mockIsVirtualDashboardDeck.mockReturnValue(true);
      mockValidateVirtualDeckOwnership.mockReturnValue(true);
      mockProjectsService.findAllByUser.mockResolvedValue({
        projects: [mockProject],
      });
      mockDeckRepository.findOne.mockResolvedValue(null); // Virtual deck doesn't exist yet
      mockDeckRepository.create.mockReturnValue({});
      mockDeckRepository.save.mockResolvedValue({});
      mockAiProviderService.generateChatResponse.mockResolvedValue(mockAiResponse);

      const result = await service.chatWithAI(chatDto, userId);

      expect(mockAiProviderService.generateChatResponse).toHaveBeenCalledWith(
        chatDto.message,
        null,
        null,
        { model: 'groq' }
      );
      expect(result.message).toBe(mockAiResponse.content);
      expect(result.provider).toBe('groq');
    });

    it('should throw error when AI generation fails', async () => {
      const chatDto: ChatRequestDto = {
        message: 'Help me',
        deckId: virtualDeckId,
      };

      const mockAiResponse = {
        success: false,
        error: 'AI generation failed',
      };

      // Mock virtual deck detection
      mockIsVirtualDashboardDeck.mockReturnValue(true);
      mockValidateVirtualDeckOwnership.mockReturnValue(true);
      mockProjectsService.findAllByUser.mockResolvedValue({ projects: [] });
      mockProjectsService.create.mockResolvedValue({ id: 'new-project' });
      mockDeckRepository.findOne.mockResolvedValue(null);
      mockDeckRepository.create.mockReturnValue({});
      mockDeckRepository.save.mockResolvedValue({});
      mockAiProviderService.generateChatResponse.mockResolvedValue(mockAiResponse);

      await expect(service.chatWithAI(chatDto, userId)).rejects.toThrow('AI generation failed');
    });

    it('should create virtual project and deck for new users', async () => {
      const chatDto: ChatRequestDto = {
        message: 'Hello',
        deckId: virtualDeckId,
      };

      const mockAiResponse = {
        success: true,
        content: 'Hello! How can I help?',
        provider: 'groq',
      };

      const mockNewProject = {
        id: 'new-virtual-project',
        name: 'Virtual Dashboard Project',
      };

      // Mock virtual deck detection
      mockIsVirtualDashboardDeck.mockReturnValue(true);
      mockValidateVirtualDeckOwnership.mockReturnValue(true);
      mockProjectsService.findAllByUser.mockResolvedValue({ projects: [] });
      mockProjectsService.create.mockResolvedValue(mockNewProject);
      mockDeckRepository.findOne.mockResolvedValue(null);
      mockDeckRepository.create.mockReturnValue({});
      mockDeckRepository.save.mockResolvedValue({});
      mockAiProviderService.generateChatResponse.mockResolvedValue(mockAiResponse);

      await service.chatWithAI(chatDto, userId);

      expect(mockProjectsService.create).toHaveBeenCalledWith({
        name: 'Virtual Dashboard Project',
        description: 'System project for dashboard conversations'
      }, userId);
      expect(mockDeckRepository.create).toHaveBeenCalledWith({
        id: virtualDeckId,
        projectId: mockNewProject.id,
        title: 'Dashboard Conversations',
        mode: 'free',
        generationData: {
          type: 'virtual',
          purpose: 'dashboard_conversations',
          userId: userId
        }
      });
    });
  });

  describe('generateDashboardSuggestions', () => {
    it('should return relevant dashboard suggestions', () => {
      const suggestions = (service as any).generateDashboardSuggestions();

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('I can help you understand the key elements of a successful pitch deck');
    });
  });
});
