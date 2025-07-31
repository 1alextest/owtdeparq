import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables
config();

// Create a ConfigService instance for accessing environment variables
const configService = new ConfigService();

// Get database URL from environment
const databaseUrl = configService.get('DATABASE_URL');

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required for migrations');
}

console.log('🔗 Setting up DataSource for migrations...');
console.log('Database URL configured:', databaseUrl ? '✅' : '❌');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  
  // Entity paths for migrations - TypeScript only
  entities: [
    'src/entities/*.entity.ts'
  ],

  // Migration configuration - TypeScript only to avoid duplicates
  migrations: [
    'src/database/migrations/*.ts'
  ],
  
  // Migration table name
  migrationsTableName: 'typeorm_migrations',
  
  // SSL configuration for Supabase
  ssl: { rejectUnauthorized: false },
  
  // Additional options
  synchronize: false, // Always false for migrations
  logging: ['query', 'error', 'warn', 'migration'],
  
  // Connection pooling
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false }
  }
});

// Initialize the data source
AppDataSource.initialize()
  .then(() => {
    console.log('✅ DataSource initialized successfully for migrations');
  })
  .catch((error) => {
    console.error('❌ Error during DataSource initialization:', error);
  });