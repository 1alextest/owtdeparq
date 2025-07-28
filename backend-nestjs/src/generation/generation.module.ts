import { Module } from '@nestjs/common';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { DecksModule } from '../decks/decks.module';
import { SlidesModule } from '../slides/slides.module';
import { AiModule } from '../ai/ai.module';
import { ContextModule } from '../context/context.module';

@Module({
  imports: [
    AuthModule,
    ProjectsModule,
    DecksModule,
    SlidesModule,
    AiModule,
    ContextModule,
  ],
  controllers: [GenerationController],
  providers: [GenerationService],
  exports: [GenerationService],
})
export class GenerationModule {}
