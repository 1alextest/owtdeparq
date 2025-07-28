import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OllamaChecker {
  private readonly logger = new Logger(OllamaChecker.name);
  private baseUrl: string;
  private enabled: boolean;
  private defaultModel: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
    this.enabled = this.configService.get<string>('OLLAMA_ENABLED') === 'true';
    this.defaultModel = this.configService.get<string>('OLLAMA_DEFAULT_MODEL') || 'llama3.1:8b';
  }

  async isAvailable(): Promise<boolean> {
    if (!this.enabled) {
      this.logger.log('Ollama is disabled in configuration');
      return false;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 2000, // Short timeout for quick check
      });

      const models = response.data.models || [];
      const hasModel = models.some(m => m.name.includes('llama3.1'));

      if (hasModel) {
        this.logger.log('Ollama is available with Llama 3.1 model');
        return true;
      } else {
        this.logger.warn('Ollama is running but Llama 3.1 model is not available');
        return false;
      }
    } catch (error) {
      this.logger.warn(`Ollama is not available: ${error.message}`);
      return false;
    }
  }

  async getStatus(): Promise<'available' | 'unavailable'> {
    return await this.isAvailable() ? 'available' : 'unavailable';
  }
}