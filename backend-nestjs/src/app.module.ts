import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import all feature modules
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { PresentationsModule } from './presentations/presentations.module';
import { DecksModule } from './decks/decks.module';
import { SlidesModule } from './slides/slides.module';
import { GenerationModule } from './generation/generation.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ExportModule } from './export/export.module';
import { TemplatesModule } from './templates/templates.module';
import { MediaModule } from './media/media.module';
import { VersionsModule } from './versions/versions.module';
import { ContextModule } from './context/context.module';
import { AiModule } from './ai/ai.module';
import { SupabaseModule } from './supabase/supabase.module';


// Import all entities
import { Project } from './entities/project.entity';
import { Presentation } from './entities/presentation.entity';
import { PitchDeck } from './entities/pitch-deck.entity';
import { Slide } from './entities/slide.entity';
import { SlideTemplate } from './entities/slide-template.entity';
import { MediaFile } from './entities/media-file.entity';
import { UserAiSettings } from './entities/user-ai-settings.entity';
import { DeckVersion } from './entities/deck-version.entity';
import { ChatContext } from './entities/chat-context.entity';
import { ContextMemoryEvent } from './entities/context-memory-event.entity';
import { LearningPattern } from './entities/learning-pattern.entity';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // TypeORM configuration for Supabase PostgreSQL - Optional for initial deployment
    ...(process.env.DATABASE_URL ? [
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const databaseUrl = configService.get('DATABASE_URL');
          const isProduction = configService.get('NODE_ENV') === 'production';
          const isDevelopment = configService.get('NODE_ENV') === 'development';
          
          console.log('🔗 Configuring database connection...');
          console.log('Environment:', configService.get('NODE_ENV', 'development'));
          console.log('Database URL configured:', databaseUrl ? '✅' : '❌');

          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [
              Project,
              Presentation,
              PitchDeck,
              Slide,
              SlideTemplate,
              MediaFile,
              UserAiSettings,
              DeckVersion,
              ChatContext,
              ContextMemoryEvent,
              LearningPattern,
            ],
            // Use migrations in production, synchronize in development
            synchronize: isDevelopment,
          logging: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
          // SSL configuration for Supabase (always required for Supabase)
          ssl: { rejectUnauthorized: false },
          // Connection pooling optimized for Supabase
          extra: {
            max: 20, // Maximum number of connections
            idleTimeoutMillis: 30000, // Close idle connections after 30s
            connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 30000, // Increased timeout for Railway
            ssl: { rejectUnauthorized: false }
          },
          // Retry configuration for better reliability
          retryAttempts: 5,
          retryDelay: 5000,
          // Additional options for better error handling
          maxQueryExecutionTime: 30000,
          installExtensions: false,
        };
      },
      inject: [ConfigService],
    })
    ] : []),

    // Minimal modules for initial deployment - add others gradually
    AiModule,
    // Database-dependent modules (will be enabled when DATABASE_URL is available)
    ...(process.env.DATABASE_URL ? [
      // SupabaseModule,
      AuthModule,
      ProjectsModule,
      PresentationsModule,
      DecksModule,
      SlidesModule,
      GenerationModule,
      ChatbotModule,
      ExportModule,
      TemplatesModule,
      MediaModule,
      VersionsModule,
      ContextModule,
    ] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
