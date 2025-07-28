import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreateSlideDto } from './dto/create-slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { Slide } from '../entities/slide.entity';
import { DecksService } from '../decks/decks.service';

@Injectable()
export class SlidesService {
  constructor(
    @InjectRepository(Slide)
    private slideRepository: Repository<Slide>,
    private decksService: DecksService,
  ) {}

  async create(createSlideDto: CreateSlideDto, userId: string): Promise<Slide> {
    // Verify deck ownership
    await this.decksService.verifyDeckOwnership(createSlideDto.deckId, userId);

    const slide = this.slideRepository.create(createSlideDto);
    return await this.slideRepository.save(slide);
  }

  async findOne(id: string, userId: string): Promise<Slide> {
    const slide = await this.slideRepository.findOne({
      where: { id },
      relations: ['deck', 'deck.project'],
    });

    if (!slide) {
      throw new NotFoundException('Slide not found');
    }

    // Verify ownership through deck
    await this.decksService.verifyDeckOwnership(slide.deckId, userId);

    return slide;
  }

  async update(id: string, updateSlideDto: UpdateSlideDto, userId: string): Promise<Slide> {
    const slide = await this.findOne(id, userId);

    Object.assign(slide, updateSlideDto);
    return await this.slideRepository.save(slide);
  }

  async reorderSlides(slideIds: string[], userId: string): Promise<void> {
    // Verify all slides belong to the same deck and user owns it
    const slides = await this.slideRepository.find({
      where: { id: In(slideIds) },
      relations: ['deck', 'deck.project'],
    });

    if (slides.length !== slideIds.length) {
      throw new NotFoundException('Some slides not found');
    }

    // Verify all slides belong to the same deck
    const deckId = slides[0].deckId;
    if (!slides.every(slide => slide.deckId === deckId)) {
      throw new Error('All slides must belong to the same deck');
    }

    // Verify ownership
    await this.decksService.verifyDeckOwnership(deckId, userId);

    // Update slide orders
    const updatePromises = slideIds.map((slideId, index) => {
      return this.slideRepository.update(slideId, { slideOrder: index });
    });

    await Promise.all(updatePromises);
  }

  async remove(id: string, userId: string): Promise<void> {
    const slide = await this.findOne(id, userId);
    await this.slideRepository.remove(slide);
  }

  async findByDeck(deckId: string, userId: string): Promise<Slide[]> {
    // Verify deck ownership
    await this.decksService.verifyDeckOwnership(deckId, userId);

    return await this.slideRepository.find({
      where: { deckId },
      order: { slideOrder: 'ASC' },
    });
  }
}
