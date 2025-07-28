import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiProviderService } from './ai-provider.service';
import { OpenaiProvider } from './providers/openai.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { GroqProvider } from './providers/groq.provider';
import { UserAiSettings } from '../entities/user-ai-settings.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UserAiSettings]),
    AuthModule,
  ],
  controllers: [AiController],
  providers: [
    AiProviderService,
    OpenaiProvider,
    OllamaProvider,
    GroqProvider,
  ],
  exports: [AiProviderService],
})
export class AiModule {}
