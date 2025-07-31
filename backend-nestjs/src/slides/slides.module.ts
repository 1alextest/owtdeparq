import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlidesController } from './slides.controller';
import { SlidesService } from './slides.service';
import { Slide } from '../entities/slide.entity';
import { PitchDeck } from '../entities/pitch-deck.entity';
import { AuthModule } from '../auth/auth.module';
import { DecksModule } from '../decks/decks.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Slide, PitchDeck]),
    AuthModule,
    DecksModule,
    ProjectsModule,
  ],
  controllers: [SlidesController],
  providers: [SlidesService],
  exports: [SlidesService],
})
export class SlidesModule {}
