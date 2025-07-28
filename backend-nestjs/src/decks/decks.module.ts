import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DecksController } from './decks.controller';
import { DeckExportController } from './export.controller';
import { DecksService } from './decks.service';
import { PitchDeck } from '../entities/pitch-deck.entity';
import { Slide } from '../entities/slide.entity';
import { Project } from '../entities/project.entity';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PitchDeck, Slide, Project]),
    AuthModule,
    ProjectsModule,
  ],
  controllers: [DecksController, DeckExportController],
  providers: [DecksService],
  exports: [DecksService],
})
export class DecksModule {}
