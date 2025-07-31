import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';

import { AiProviderService, GenerationResult } from './ai-provider.service';
import { UserAiSettings } from '../entities/user-ai-settings.entity';
import { OpenaiProvider } from './providers/openai.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { GroqProvider } from './providers/groq.provider';
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto';
import { SlideType } from '../entities/slide.entity';
import { PromptContext } from './prompts/prompt-templates';

describe('AiProviderService', () => {
  let service: AiProviderService;
  let userSettingsRepository: jest.Mocked<Repository<UserAiSettings>>;
  let openaiProvider: jest.Mocked<OpenaiProvider>;
  let ollamaProvider: jest.Mocked<OllamaProvider>;
  let groqProvider: jest.Mocked<GroqProvider>;

  const mockUserId = 'user-123';
  const mockUserSettings: UserAiSettings = {
    userId: mockUserId,
    openaiApiKey: null,
    learningEnabled: true,
    learningScope: 'deck',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSlideResult = {
    title: 'Test Slide',
    content: 'Test content',
    speakerNotes: 'Test notes',
    model: 'gpt-4',
    tokensUsed: 100,
    confidence: 0.9,
  };

  const mockDeckSlides = [
    {
      title: 'Introduction',
      content: 'Welcome to our presentation',
      slideType: 'title',
      slideOrder: 1,
    },
    {
      title: 'Problem',
      content: 'The problem we solve',
      slideType: 'content',
      slideOrder: 2,
    },
  ];

  beforeEach(async () => {
    // Mock environment variables
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.GROQ_API_KEY = 'test-groq-key';
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiProviderService,
        {
          provide: getRepositoryToken(UserAiSettings),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: OpenaiProvider,
          useValue: {
            generateSlideContent: jest.fn(),
            generateFreeFormDeck: jest.fn(),
            generateChatResponse: jest.fn(),
            getStatus: jest.fn(),
          },
        },
        {
          provide: OllamaProvider,
          useValue: {
            generateSlideContent: jest.fn(),
            generateFreeFormDeck: jest.fn(),
            generateChatResponse: jest.fn(),
            getStatus: jest.fn(),
          },
        },
        {
          provide: GroqProvider,
          useValue: {
            generateSlideContent: jest.fn(),
            generateFreeFormDeck: jest.fn(),
            generateChatResponse: jest.fn(),
            getStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiProviderService>(AiProviderService);
    userSettingsRepository = module.get(getRepositoryToken(UserAiSettings));
    openaiProvider = module.get(OpenaiProvider);
    ollamaProvider = module.get(OllamaProvider);
    groqProvider = module.get(GroqProvider);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clean up environment variables
    delete process.env.OPENAI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.OLLAMA_BASE_URL;
  });

  describe('generateSlideContent', () => {
    const mockContext: PromptContext = {
      slideType: 'cover',
      companyName: 'Test Company',
      industry: 'Technology',
      targetMarket: 'Investors',
    };

    it('should generate slide content with first available provider', async () => {
      openaiProvider.generateSlideContent.mockResolvedValue(mockSlideResult);

      const result = await service.generateSlideContent(
        'cover',
        mockContext,
        { model: 'gpt-4' }
      );

      expect(openaiProvider.generateSlideContent).toHaveBeenCalledWith(
        'cover',
        mockContext,
        { model: 'gpt-4' }
      );
      expect(result).toEqual({
        success: true,
        content: mockSlideResult,
        provider: 'openai',
        model: 'gpt-4',
        tokensUsed: 100,
        confidence: 0.9,
      });
    });

    it('should fallback to next provider when first fails', async () => {
      openaiProvider.generateSlideContent.mockRejectedValue(new Error('API Error'));
      groqProvider.generateSlideContent.mockResolvedValue(mockSlideResult);

      const result = await service.generateSlideContent(
        'problem',
        mockContext
      );

      expect(openaiProvider.generateSlideContent).toHaveBeenCalled();
      expect(groqProvider.generateSlideContent).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.provider).toBe('groq');
    });

    it('should return failure when all providers fail', async () => {
      openaiProvider.generateSlideContent.mockRejectedValue(new Error('OpenAI Error'));
      groqProvider.generateSlideContent.mockRejectedValue(new Error('Groq Error'));
      ollamaProvider.generateSlideContent.mockRejectedValue(new Error('Ollama Error'));

      const result = await service.generateSlideContent(
        SlideType.CONTENT,
        mockContext
      );

      expect(result).toEqual({
        success: false,
        error: 'All AI providers failed',
        provider: 'none',
        model: 'none',
      });
    });

    it('should handle null result from provider', async () => {
      openaiProvider.generateSlideContent.mockResolvedValue(null);
      groqProvider.generateSlideContent.mockResolvedValue(mockSlideResult);

      const result = await service.generateSlideContent(
        SlideType.CONTENT,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('groq');
    });

    it('should use correct provider order for local model', async () => {
      ollamaProvider.generateSlideContent.mockResolvedValue(mockSlideResult);

      const result = await service.generateSlideContent(
        SlideType.CONTENT,
        mockContext,
        { model: 'llama3.1-8b' }
      );

      expect(ollamaProvider.generateSlideContent).toHaveBeenCalledBefore(
        openaiProvider.generateSlideContent as jest.Mock
      );
      expect(result.provider).toBe('local');
    });
  });

  describe('generateFreeFormDeck', () => {
    const mockPrompt = 'Create a pitch deck for a tech startup';

    it('should generate deck with slides successfully', async () => {
      openaiProvider.generateFreeFormDeck.mockResolvedValue(mockDeckSlides);

      const result = await service.generateFreeFormDeck(mockPrompt, {
        model: 'gpt-4',
      });

      expect(openaiProvider.generateFreeFormDeck).toHaveBeenCalledWith(
        mockPrompt,
        { model: 'gpt-4' }
      );
      expect(result).toEqual({
        success: true,
        content: mockDeckSlides,
        provider: 'openai',
        model: 'gpt-4',
      });
    });

    it('should fallback to next provider on failure', async () => {
      openaiProvider.generateFreeFormDeck.mockRejectedValue(new Error('API Error'));
      groqProvider.generateFreeFormDeck.mockResolvedValue(mockDeckSlides);

      const result = await service.generateFreeFormDeck(mockPrompt);

      expect(groqProvider.generateFreeFormDeck).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.provider).toBe('groq');
    });

    it('should handle invalid slides format', async () => {
      openaiProvider.generateFreeFormDeck.mockResolvedValue('invalid format' as any);
      groqProvider.generateFreeFormDeck.mockResolvedValue(mockDeckSlides);

      const result = await service.generateFreeFormDeck(mockPrompt);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('groq');
    });

    it('should handle null slides result', async () => {
      openaiProvider.generateFreeFormDeck.mockResolvedValue(null);
      groqProvider.generateFreeFormDeck.mockResolvedValue(mockDeckSlides);

      const result = await service.generateFreeFormDeck(mockPrompt);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('groq');
    });

    it('should use correct provider order for Groq model', async () => {
      groqProvider.generateFreeFormDeck.mockResolvedValue(mockDeckSlides);

      const result = await service.generateFreeFormDeck(mockPrompt, {
        model: 'groq-llama-8b',
      });

      expect(groqProvider.generateFreeFormDeck).toHaveBeenCalledBefore(
        openaiProvider.generateFreeFormDeck as jest.Mock
      );
      expect(result.provider).toBe('groq');
    });
  });

  describe('generateChatResponse', () => {
    const mockUserMessage = 'How can I improve this slide?';
    const mockDeckContext = { title: 'My Deck', slides: mockDeckSlides };
    const mockSlideContext = { title: 'Current Slide', content: 'Content' };
    const mockChatResponse = 'Here are some suggestions to improve your slide...';

    it('should generate chat response successfully', async () => {
      openaiProvider.generateChatResponse.mockResolvedValue(mockChatResponse);

      const result = await service.generateChatResponse(
        mockUserMessage,
        mockDeckContext,
        mockSlideContext,
        { model: 'gpt-4' }
      );

      expect(openaiProvider.generateChatResponse).toHaveBeenCalledWith(
        mockUserMessage,
        mockDeckContext,
        mockSlideContext,
        { model: 'gpt-4' }
      );
      expect(result).toEqual({
        success: true,
        content: mockChatResponse,
        provider: 'openai',
        model: 'gpt-4',
      });
    });

    it('should fallback to next provider on failure', async () => {
      openaiProvider.generateChatResponse.mockRejectedValue(new Error('API Error'));
      groqProvider.generateChatResponse.mockResolvedValue(mockChatResponse);

      const result = await service.generateChatResponse(
        mockUserMessage,
        mockDeckContext
      );

      expect(groqProvider.generateChatResponse).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.provider).toBe('groq');
    });

    it('should handle invalid response format', async () => {
      openaiProvider.generateChatResponse.mockResolvedValue(null);
      groqProvider.generateChatResponse.mockResolvedValue(mockChatResponse);

      const result = await service.generateChatResponse(
        mockUserMessage,
        mockDeckContext
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('groq');
    });

    it('should work without slide context', async () => {
      openaiProvider.generateChatResponse.mockResolvedValue(mockChatResponse);

      const result = await service.generateChatResponse(
        mockUserMessage,
        mockDeckContext
      );

      expect(openaiProvider.generateChatResponse).toHaveBeenCalledWith(
        mockUserMessage,
        mockDeckContext,
        undefined,
        {}
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return all providers with their status', async () => {
      openaiProvider.getStatus.mockResolvedValue('available');
      groqProvider.getStatus.mockResolvedValue('available');
      ollamaProvider.getStatus.mockResolvedValue('unavailable');

      const providers = await service.getAvailableProviders();

      expect(providers).toHaveLength(7);
      expect(providers[0]).toEqual({
        name: 'openai',
        displayName: 'OpenAI GPT-4',
        models: ['gpt-4', 'gpt-3.5-turbo'],
        status: 'available',
        costTier: 'paid',
        isLocal: false,
      });
      expect(providers.find(p => p.name === 'llama3.1-8b')).toEqual({
        name: 'llama3.1-8b',
        displayName: 'Llama 3.1 (8B)',
        models: ['llama3.1:8b'],
        status: 'unavailable',
        costTier: 'free',
        isLocal: true,
      });
    });

    it('should handle provider status errors gracefully', async () => {
      openaiProvider.getStatus.mockRejectedValue(new Error('Status error'));
      groqProvider.getStatus.mockResolvedValue('available');
      ollamaProvider.getStatus.mockResolvedValue('available');

      const providers = await service.getAvailableProviders();

      expect(providers).toHaveLength(7);
      // Should still return providers even if status check fails
    });
  });

  describe('getUserSettings', () => {
    it('should return existing user settings', async () => {
      userSettingsRepository.findOne.mockResolvedValue(mockUserSettings);

      const result = await service.getUserSettings(mockUserId);

      expect(userSettingsRepository.findOne).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(result).toEqual(mockUserSettings);
    });

    it('should create default settings for new user', async () => {
      userSettingsRepository.findOne.mockResolvedValue(null);
      userSettingsRepository.create.mockReturnValue(mockUserSettings);
      userSettingsRepository.save.mockResolvedValue(mockUserSettings);

      const result = await service.getUserSettings(mockUserId);

      expect(userSettingsRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        learningEnabled: true,
        learningScope: 'deck',
      });
      expect(userSettingsRepository.save).toHaveBeenCalledWith(mockUserSettings);
      expect(result).toEqual(mockUserSettings);
    });
  });

  describe('updateUserSettings', () => {
    it('should update existing user settings', async () => {
      const updateDto: UpdateAiSettingsDto = {
        learningEnabled: false,
        learningScope: 'global',
      };

      const updatedSettings = { ...mockUserSettings, ...updateDto };

      userSettingsRepository.findOne.mockResolvedValue(mockUserSettings);
      userSettingsRepository.save.mockResolvedValue(updatedSettings);

      const result = await service.updateUserSettings(mockUserId, updateDto);

      expect(userSettingsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto)
      );
      expect(result).toEqual(updatedSettings);
    });

    it('should create settings if user does not exist', async () => {
      const updateDto: UpdateAiSettingsDto = {
        openaiApiKey: 'new-api-key',
      };

      userSettingsRepository.findOne.mockResolvedValue(null);
      userSettingsRepository.create.mockReturnValue(mockUserSettings);
      userSettingsRepository.save
        .mockResolvedValueOnce(mockUserSettings) // First save for creation
        .mockResolvedValueOnce({ ...mockUserSettings, ...updateDto }); // Second save for update

      const result = await service.updateUserSettings(mockUserId, updateDto);

      expect(userSettingsRepository.create).toHaveBeenCalled();
      expect(userSettingsRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('provider configuration validation', () => {
    it('should log warnings for missing API keys', () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.GROQ_API_KEY;

      // Create new service instance to trigger validation
      new AiProviderService(
        userSettingsRepository,
        openaiProvider,
        ollamaProvider,
        groqProvider
      );

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        'AI Provider Configuration Warnings:'
      );
    });

    it('should log success when all providers configured', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.GROQ_API_KEY = 'test-key';
      process.env.OLLAMA_BASE_URL = 'http://localhost:11434';

      new AiProviderService(
        userSettingsRepository,
        openaiProvider,
        ollamaProvider,
        groqProvider
      );

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'All AI providers properly configured'
      );
    });
  });

  describe('provider order logic', () => {
    it('should prioritize local provider for llama models', async () => {
      ollamaProvider.generateFreeFormDeck.mockResolvedValue(mockDeckSlides);

      await service.generateFreeFormDeck('test prompt', { model: 'llama3.1-8b' });

      expect(ollamaProvider.generateFreeFormDeck).toHaveBeenCalledBefore(
        groqProvider.generateFreeFormDeck as jest.Mock
      );
    });

    it('should prioritize groq provider for groq models', async () => {
      groqProvider.generateFreeFormDeck.mockResolvedValue(mockDeckSlides);

      await service.generateFreeFormDeck('test prompt', { model: 'groq-llama-8b' });

      expect(groqProvider.generateFreeFormDeck).toHaveBeenCalledBefore(
        openaiProvider.generateFreeFormDeck as jest.Mock
      );
    });

    it('should use default order for unspecified models', async () => {
      groqProvider.generateFreeFormDeck.mockResolvedValue(mockDeckSlides);

      await service.generateFreeFormDeck('test prompt');

      expect(groqProvider.generateFreeFormDeck).toHaveBeenCalledBefore(
        openaiProvider.generateFreeFormDeck as jest.Mock
      );
    });
  });
});