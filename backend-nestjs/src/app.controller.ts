import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'API is running' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Detailed health check' })
  @ApiResponse({ status: 200, description: 'Health status' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('health/database')
  @ApiOperation({ summary: 'Database connection health check' })
  @ApiResponse({ status: 200, description: 'Database connection status' })
  async checkDatabase() {
    const connectionInfo = await this.supabaseService.getConnectionInfo();
    const isConnected = await this.supabaseService.checkConnection();
    
    return {
      ...connectionInfo,
      status: isConnected ? 'connected' : 'disconnected',
    };
  }

  @Get('health/database/test')
  @ApiOperation({ summary: 'Test database query' })
  @ApiResponse({ status: 200, description: 'Database query test result' })
  async testDatabaseQuery() {
    return await this.supabaseService.testQuery();
  }
}
