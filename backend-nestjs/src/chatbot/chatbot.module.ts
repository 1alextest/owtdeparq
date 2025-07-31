import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { ChatContext } from '../entities/chat-context.entity';
import { PitchDeck } from '../entities/pitch-deck.entity';
import { AuthModule } from '../auth/auth.module';
import { DecksModule } from '../decks/decks.module';
import { SlidesModule } from '../slides/slides.module';
import { ProjectsModule } from '../projects/projects.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatContext, PitchDeck]),
    AuthModule,
    DecksModule,
    SlidesModule,
    ProjectsModule,
    AiModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
