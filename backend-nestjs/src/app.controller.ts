import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Application health check' })
  @ApiResponse({ status: 200, description: 'Health status' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('health/database')
  @ApiOperation({ summary: 'Database connection health check' })
  @ApiResponse({ status: 200, description: 'Database connection status' })
  async checkDatabase() {
    const hasDatabase = !!process.env.DATABASE_URL;
    const hasValidDatabase = hasDatabase && !process.env.DATABASE_URL.includes('your-database-url');
    
    return {
      status: hasValidDatabase ? 'configured' : 'not_configured',
      message: hasValidDatabase ? 'Database URL is configured' : 'DATABASE_URL environment variable not set or invalid',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      aiProviders: {
        groq: !!process.env.GROQ_API_KEY,
        openai: process.env.OPENAI_ENABLED === 'true' && !!process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('dummy'),
        ollama: process.env.OLLAMA_ENABLED === 'true',
      }
    };
  }
}
