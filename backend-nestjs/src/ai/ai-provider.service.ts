import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserAiSettings } from "../entities/user-ai-settings.entity";
import { UpdateAiSettingsDto } from "./dto/update-ai-settings.dto";
import {
  OpenaiProvider,
  GenerationOptions,
  SlideGenerationResult,
} from "./providers/openai.provider";
import { OllamaProvider } from "./providers/ollama.provider";
import { GroqProvider } from "./providers/groq.provider";
import { SlideType } from "../entities/slide.entity";
import { PromptContext } from "./prompts/prompt-templates";
import { AIErrorHandler, AIError } from "./utils/error-handler";

export interface AIProvider {
  name: string;
  displayName: string;
  models: string[];
  status: "available" | "unavailable" | "quota_exceeded";
  costTier: "free" | "paid";
  isLocal: boolean;
}

export interface GenerationResult {
  success: boolean;
  content?: any;
  error?: string;
  provider: string;
  model: string;
  tokensUsed?: number;
  confidence?: number;
}

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);
  private providers: Map<string, any>;
  private fallbackOrder = ["groq", "openai", "local"];

  constructor(
    @InjectRepository(UserAiSettings)
    private userSettingsRepository: Repository<UserAiSettings>,
    private openaiProvider: OpenaiProvider,
    private ollamaProvider: OllamaProvider,
    private groqProvider: GroqProvider
  ) {
    this.providers = new Map([
      ["openai", this.openaiProvider],
      ["local", this.ollamaProvider as any],
      ["groq", this.groqProvider as any],
    ]);

    // Validate provider configurations on startup
    this.validateProviderConfigurations();
  }

  private validateProviderConfigurations(): void {
    this.logger.log("Validating AI provider configurations...");

    const warnings: string[] = [];

    // Check OpenAI configuration
    if (!process.env.OPENAI_API_KEY) {
      warnings.push(
        "OpenAI API key not configured - OpenAI provider will be unavailable"
      );
    }

    // Check Groq configuration
    if (!process.env.GROQ_API_KEY) {
      warnings.push(
        "Groq API key not configured - Groq provider will be unavailable"
      );
    }

    // Check Ollama configuration
    if (!process.env.OLLAMA_BASE_URL) {
      warnings.push(
        "Ollama base URL not configured - Local AI provider will be unavailable"
      );
    }

    if (warnings.length > 0) {
      this.logger.warn("AI Provider Configuration Warnings:");
      warnings.forEach((warning) => this.logger.warn(`  - ${warning}`));
    } else {
      this.logger.log("All AI providers properly configured");
    }
  }

  async generateSlideContent(
    slideType: SlideType,
    context: PromptContext,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const providerOrder = this.getProviderOrder(options.model || "groq");

    for (const providerName of providerOrder) {
      try {
        this.logger.log(`Attempting slide generation with ${providerName}`);
        const provider = this.providers.get(providerName);

        if (!provider) {
          this.logger.warn(`Provider ${providerName} not found`);
          continue;
        }

        const result = await provider.generateSlideContent(
          slideType,
          context,
          options
        );

        if (!result) {
          this.logger.warn(`Provider ${providerName} returned null result`);
          continue;
        }

        return {
          success: true,
          content: result,
          provider: providerName,
          model: result?.model || "unknown",
          tokensUsed: result?.tokensUsed || 0,
          confidence: result?.confidence || 0.5,
        };
      } catch (error) {
        const aiError = AIErrorHandler.handleProviderError(
          error,
          providerName,
          "slide generation"
        );
        this.logger.warn(`Provider ${providerName} failed: ${aiError.message}`);
        continue;
      }
    }

    return {
      success: false,
      error: "All AI providers failed",
      provider: "none",
      model: "none",
    };
  }

  async generateFreeFormDeck(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    this.logger.log(`generateFreeFormDeck called with model: ${options.model}`);
    const providerOrder = this.getProviderOrder(options.model || "groq");
    this.logger.log(`Provider order: ${providerOrder.join(", ")}`);

    for (const providerName of providerOrder) {
      try {
        this.logger.log(`Attempting deck generation with ${providerName}`);
        const provider = this.providers.get(providerName);

        if (!provider) {
          this.logger.warn(`Provider ${providerName} not found`);
          continue;
        }

        this.logger.log(`Calling ${providerName}.generateFreeFormDeck...`);
        const slides = await provider.generateFreeFormDeck(prompt, options);
        this.logger.log(
          `${providerName} generation successful, got ${slides?.length || 0} slides`
        );

        if (!slides || !Array.isArray(slides)) {
          this.logger.warn(
            `Provider ${providerName} returned invalid slides format`
          );
          continue;
        }

        return {
          success: true,
          content: slides,
          provider: providerName,
          model: options.model || "default",
        };
      } catch (error) {
        const aiError = AIErrorHandler.handleProviderError(
          error,
          providerName,
          "deck generation"
        );
        this.logger.warn(`Provider ${providerName} failed: ${aiError.message}`);
        continue;
      }
    }

    return {
      success: false,
      error: "All AI providers failed",
      provider: "none",
      model: "none",
    };
  }

  async generateChatResponse(
    userMessage: string,
    deckContext: any,
    slideContext?: any,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const providerOrder = this.getProviderOrder(options.model || "groq");

    for (const providerName of providerOrder) {
      try {
        const provider = this.providers.get(providerName);

        if (!provider) {
          this.logger.warn(`Provider ${providerName} not found`);
          continue;
        }

        const response = await provider.generateChatResponse(
          userMessage,
          deckContext,
          slideContext,
          options
        );

        if (!response || typeof response !== "string") {
          this.logger.warn(
            `Provider ${providerName} returned invalid chat response`
          );
          continue;
        }

        return {
          success: true,
          content: response,
          provider: providerName,
          model: options.model || "default",
        };
      } catch (error) {
        const aiError = AIErrorHandler.handleProviderError(
          error,
          providerName,
          "chat generation"
        );
        this.logger.warn(
          `Chat provider ${providerName} failed: ${aiError.message}`
        );
        continue;
      }
    }

    return {
      success: false,
      error: "All AI providers failed",
      provider: "none",
      model: "none",
    };
  }

  async getAvailableProviders(): Promise<AIProvider[]> {
    const ollamaStatus = await this.ollamaProvider.getStatus();
    const groqStatus = await this.groqProvider.getStatus();

    const providers: AIProvider[] = [
      {
        name: "openai",
        displayName: "OpenAI GPT-4",
        models: ["gpt-4", "gpt-3.5-turbo"],
        status: await this.openaiProvider.getStatus(),
        costTier: "paid",
        isLocal: false,
      },
      {
        name: "groq-llama-8b",
        displayName: "Groq Llama 3 (8B)",
        models: ["llama3-8b-8192"],
        status: groqStatus,
        costTier: "paid",
        isLocal: false,
      },
      {
        name: "groq-llama-70b",
        displayName: "Groq Llama 3 (70B)",
        models: ["llama3-70b-8192"],
        status: groqStatus,
        costTier: "paid",
        isLocal: false,
      },
      {
        name: "groq-gemma",
        displayName: "Groq Gemma 7B",
        models: ["gemma-7b-it"],
        status: groqStatus,
        costTier: "paid",
        isLocal: false,
      },
      {
        name: "llama3.1-8b",
        displayName: "Llama 3.1 (8B)",
        models: ["llama3.1:8b"],
        status: ollamaStatus,
        costTier: "free",
        isLocal: true,
      },
      {
        name: "llama3.1-instruct",
        displayName: "Llama 3.1 Instruct",
        models: ["llama3.1:instruct"],
        status: ollamaStatus,
        costTier: "free",
        isLocal: true,
      },
      {
        name: "llama3.1-70b",
        displayName: "Llama 3.1 (70B)",
        models: ["llama3.1:70b"],
        status: ollamaStatus,
        costTier: "free",
        isLocal: true,
      },
    ];

    return providers;
  }

  async getUserSettings(userId: string): Promise<UserAiSettings> {
    let settings = await this.userSettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = this.userSettingsRepository.create({
        userId,
        learningEnabled: true,
        learningScope: "deck",
      });
      settings = await this.userSettingsRepository.save(settings);
    }

    return settings;
  }

  async updateUserSettings(
    userId: string,
    updateDto: UpdateAiSettingsDto
  ): Promise<UserAiSettings> {
    let settings = await this.getUserSettings(userId);

    Object.assign(settings, updateDto);
    return await this.userSettingsRepository.save(settings);
  }

  private getProviderOrder(modelChoice: string): string[] {
    // Return provider order based on model choice and availability
    if (
      modelChoice &&
      (modelChoice === "llama3.1-8b" ||
        modelChoice === "llama3.1-instruct" ||
        modelChoice === "llama3.1-70b" ||
        modelChoice === "local")
    ) {
      return ["local", "groq", "openai"];
    }

    if (modelChoice && modelChoice.startsWith("groq-")) {
      return ["groq", "openai", "local"];
    }

    return this.fallbackOrder;
  }
}
