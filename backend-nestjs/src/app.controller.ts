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
    return {
      status: process.env.DATABASE_URL ? 'configured' : 'not_configured',
      message: process.env.DATABASE_URL ? 'Database URL is configured' : 'DATABASE_URL environment variable not set',
      timestamp: new Date().toISOString(),
    };
  }
}
