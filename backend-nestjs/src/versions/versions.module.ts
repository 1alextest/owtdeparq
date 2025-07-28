import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionsController } from './versions.controller';
import { VersionsService } from './versions.service';
import { DeckVersion } from '../entities/deck-version.entity';
import { AuthModule } from '../auth/auth.module';
import { DecksModule } from '../decks/decks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeckVersion]),
    AuthModule,
    DecksModule,
  ],
  controllers: [VersionsController],
  providers: [VersionsService],
  exports: [VersionsService],
})
export class VersionsModule {}
