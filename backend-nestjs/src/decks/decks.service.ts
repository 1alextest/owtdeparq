import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { PitchDeck } from '../entities/pitch-deck.entity';
import { ProjectsService } from '../projects/projects.service';
import { isVirtualDashboardDeck } from '../utils/virtual-decks';

@Injectable()
export class DecksService {
  constructor(
    @InjectRepository(PitchDeck)
    private deckRepository: Repository<PitchDeck>,
    private projectsService: ProjectsService,
  ) {}

  async create(createDeckDto: CreateDeckDto, userId: string): Promise<PitchDeck> {
    // Verify project ownership
    await this.projectsService.verifyProjectOwnership(createDeckDto.projectId, userId);

    const deck = this.deckRepository.create(createDeckDto);
    return await this.deckRepository.save(deck);
  }

  async findOne(id: string, userId: string): Promise<PitchDeck> {
    const deck = await this.deckRepository.findOne({
      where: { id },
      relations: ['project', 'slides'],
    });

    if (!deck) {
      throw new NotFoundException('Deck not found');
    }

    // Verify ownership through project
    await this.projectsService.verifyProjectOwnership(deck.projectId, userId);

    // Sort slides by order
    if (deck.slides) {
      deck.slides.sort((a, b) => a.slideOrder - b.slideOrder);
    }

    return deck;
  }

  async update(id: string, updateDeckDto: UpdateDeckDto, userId: string): Promise<PitchDeck> {
    const deck = await this.findOne(id, userId);

    Object.assign(deck, updateDeckDto);
    return await this.deckRepository.save(deck);
  }

  async remove(id: string, userId: string): Promise<void> {
    const deck = await this.findOne(id, userId);
    await this.deckRepository.remove(deck);
  }

  async getDeckSlides(deckId: string, userId: string): Promise<any[]> {
    const deck = await this.findOne(deckId, userId);
    return deck.slides || [];
  }

  async verifyDeckOwnership(deckId: string, userId: string): Promise<PitchDeck> {
    // Reject virtual deck IDs in real deck operations
    if (isVirtualDashboardDeck(deckId, userId)) {
      throw new NotFoundException('Cannot perform deck operations on virtual dashboard deck');
    }

    const deck = await this.deckRepository.findOne({
      where: { id: deckId },
      relations: ['project'],
    });

    if (!deck) {
      throw new NotFoundException('Deck not found');
    }

    await this.projectsService.verifyProjectOwnership(deck.projectId, userId);
    return deck;
  }

  // Public method for export functionality (no auth required)
  async findOneForExport(id: string): Promise<PitchDeck> {
    const deck = await this.deckRepository.findOne({
      where: { id },
      relations: ['slides'],
    });

    if (!deck) {
      throw new NotFoundException('Deck not found');
    }

    // Sort slides by order
    if (deck.slides) {
      deck.slides.sort((a, b) => a.slideOrder - b.slideOrder);
    }

    return deck;
  }
}
