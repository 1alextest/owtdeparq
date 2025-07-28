import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.checkConnection();
  }

  async checkConnection(): Promise<boolean> {
    try {
      this.logger.log('🔗 Checking Supabase database connection...');
      
      if (!this.dataSource.isInitialized) {
        this.logger.warn('⚠️ DataSource is not initialized');
        return false;
      }

      // Test with a simple query
      await this.dataSource.query('SELECT 1');
      this.logger.log('✅ Supabase database connection successful');
      return true;
      
    } catch (error) {
      this.logger.error('❌ Supabase database connection failed');
      this.logger.error(`Error: ${error.message}`);
      
      // Provide specific troubleshooting based on error type
      if (error.code === 'ENOTFOUND') {
        this.logger.error('🔧 DNS resolution failed - check Supabase URL');
      } else if (error.code === 'ECONNREFUSED') {
        this.logger.error('🔧 Connection refused - check if Supabase project is running');
      } else if (error.message.includes('password authentication failed')) {
        this.logger.error('🔧 Authentication failed - check database password');
      } else if (error.message.includes('timeout')) {
        this.logger.error('🔧 Connection timeout - check network connectivity');
      }
      
      return false;
    }
  }

  async getConnectionInfo() {
    const databaseUrl = this.configService.get('DATABASE_URL');
    const isInitialized = this.dataSource.isInitialized;
    
    return {
      status: isInitialized ? 'initialized' : 'not_initialized',
      database: 'supabase-postgresql',
      hasUrl: !!databaseUrl,
      driver: this.dataSource.options.type,
      timestamp: new Date().toISOString(),
    };
  }

  async testQuery(query: string = 'SELECT NOW() as current_time') {
    try {
      const result = await this.dataSource.query(query);
      return {
        success: true,
        result: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}