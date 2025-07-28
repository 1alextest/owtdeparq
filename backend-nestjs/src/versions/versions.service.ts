import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeckVersion } from '../entities/deck-version.entity';
import { DecksService } from '../decks/decks.service';

@Injectable()
export class VersionsService {
  constructor(
    @InjectRepository(DeckVersion)
    private versionRepository: Repository<DeckVersion>,
    private decksService: DecksService,
  ) {}

  async getDeckVersions(deckId: string, userId: string) {
    await this.decksService.verifyDeckOwnership(deckId, userId);
    
    return await this.versionRepository.find({
      where: { deckId },
      order: { versionNumber: 'DESC' },
      select: ['id', 'versionNumber', 'description', 'changeSummary', 'createdAt'],
    });
  }

  async createVersion(deckId: string, versionData: any, userId: string) {
    const deck = await this.decksService.findOne(deckId, userId);
    
    const lastVersion = await this.versionRepository.findOne({
      where: { deckId },
      order: { versionNumber: 'DESC' },
    });
    
    const newVersionNumber = (lastVersion?.versionNumber || 0) + 1;
    
    const version = this.versionRepository.create({
      deckId,
      versionNumber: newVersionNumber,
      description: versionData.description,
      changeSummary: versionData.changeSummary,
      versionData: {
        deck: deck,
        timestamp: new Date(),
      },
    });

    return await this.versionRepository.save(version);
  }

  async restoreVersion(deckId: string, versionId: string, userId: string) {
    await this.decksService.verifyDeckOwnership(deckId, userId);
    
    const version = await this.versionRepository.findOne({
      where: { id: versionId, deckId },
    });

    if (!version) {
      throw new Error('Version not found');
    }

    // TODO: Implement deck restoration logic
    // This would restore the deck and slides to the saved state
    
    return { message: 'Version restoration not yet implemented' };
  }
}
