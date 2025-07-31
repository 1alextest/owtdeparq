import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';

import { AiProviderService } from './ai-provider.service';
import { UserAiSettings } from '../entities/user-ai-settings.entity';
import { OpenaiProvider } from './providers/openai.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { GroqProvider } from './providers/groq.provider';
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto';

describe('AiProviderService (Simplified)', () => {
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

  describe('generateFreeFormDeck', () => {
    const mockPrompt = 'Create a pitch deck for a tech startup';
    const mockDeckSlides = [
      {
        title: 'Introduction',
        content: 'Welcome to our presentation',
        slideType: 'cover',
        slideOrder: 1,
      },
      {
        title: 'Problem',
        content: 'The problem we solve',
        slideType: 'problem',
        slideOrder: 2,
      },
    ];

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

    it('should return failure when all providers fail', async () => {
      openaiProvider.generateFreeFormDeck.mockRejectedValue(new Error('OpenAI Error'));
      groqProvider.generateFreeFormDeck.mockRejectedValue(new Error('Groq Error'));
      ollamaProvider.generateFreeFormDeck.mockRejectedValue(new Error('Ollama Error'));

      const result = await service.generateFreeFormDeck(mockPrompt);

      expect(result).toEqual({
        success: false,
        error: 'All AI providers failed',
        provider: 'none',
        model: 'none',
      });
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
  });
});