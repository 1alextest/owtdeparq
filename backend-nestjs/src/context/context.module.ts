import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContextController } from './context.controller';
import { ContextService } from './context.service';
import { ContextMemoryEvent } from '../entities/context-memory-event.entity';
import { LearningPattern } from '../entities/learning-pattern.entity';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { DecksModule } from '../decks/decks.module';
import { PatternAnalyzerService } from './learning/pattern-analyzer.service';
import { RecommendationEngineService } from './learning/recommendation-engine.service';
import { ContextTrackerService } from './learning/context-tracker.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContextMemoryEvent, LearningPattern]),
    AuthModule,
    ProjectsModule,
    DecksModule,
  ],
  controllers: [ContextController],
  providers: [
    ContextService,
    PatternAnalyzerService,
    RecommendationEngineService,
    ContextTrackerService,
  ],
  exports: [
    ContextService,
    PatternAnalyzerService,
    RecommendationEngineService,
    ContextTrackerService,
  ],
})
export class ContextModule {}
