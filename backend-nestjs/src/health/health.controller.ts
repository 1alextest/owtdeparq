import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  @Get()
  async checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('database')
  async checkDatabase() {
    try {
      // Try to count projects as a simple database check
      const count = await this.projectsRepository.count();
      
      return {
        status: 'ok',
        database: 'connected',
        projectCount: count,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('ai')
  async checkAI() {
    const results = {
      openai: await this.checkOpenAI(),
      groq: await this.checkGroq(),
      ollama: await this.checkOllama(),
      timestamp: new Date().toISOString(),
    };

    return {
      status: results.openai.status === 'ok' || results.groq.status === 'ok' || results.ollama.status === 'ok' ? 'ok' : 'error',
      providers: results,
    };
  }

  @Get('ollama')
  async checkOllamaStatus() {
    return await this.checkOllama();
  }

  private async checkGroq() {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const enabled = this.configService.get<string>('GROQ_ENABLED') === 'true';
    
    if (!enabled) {
      return {
        status: 'disabled',
        message: 'Groq is disabled in configuration',
      };
    }
    
    if (!apiKey || apiKey === 'your-groq-api-key-here') {
      return {
        status: 'error',
        message: 'Groq API key not configured or using placeholder value',
      };
    }

    try {
      // We don't actually call Groq API to avoid unnecessary usage
      return {
        status: 'ok',
        message: 'Groq API key is configured',
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Groq check failed: ${error.message}`,
      };
    }
  }

  private async checkOpenAI() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey || apiKey === 'sk-dummy-key-for-testing-replace-with-real-key') {
      return {
        status: 'error',
        message: 'OpenAI API key not configured or using dummy key',
      };
    }

    try {
      // We don't actually call OpenAI API to avoid unnecessary charges
      return {
        status: 'ok',
        message: 'OpenAI API key is configured',
      };
    } catch (error) {
      return {
        status: 'error',
        message: `OpenAI check failed: ${error.message}`,
      };
    }
  }

  private async checkOllama() {
    const baseUrl = this.configService.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
    const enabled = this.configService.get<string>('OLLAMA_ENABLED') === 'true';
    
    if (!enabled) {
      return {
        status: 'disabled',
        message: 'Ollama is disabled in configuration',
      };
    }

    try {
      const response = await axios.get(`${baseUrl}/api/tags`, {
        timeout: 2000,
      });
      
      const models = response.data.models || [];
      const hasLlama = models.some(m => m.name.includes('llama3.1'));
      
      if (hasLlama) {
        return {
          status: 'ok',
          message: 'Ollama is available with Llama 3.1 model',
          models: models.map(m => m.name),
        };
      } else {
        return {
          status: 'warning',
          message: 'Ollama is running but Llama 3.1 model is not available',
          models: models.map(m => m.name),
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: `Ollama check failed: ${error.message}`,
      };
    }
  }
}