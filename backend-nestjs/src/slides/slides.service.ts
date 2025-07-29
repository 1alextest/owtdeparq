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

  async autosave(id: string, updateSlideDto: UpdateSlideDto, userId: string): Promise<{ timestamp: string }> {
    const slide = await this.findOne(id, userId);

    Object.assign(slide, updateSlideDto);
    await this.slideRepository.save(slide);
    
    return { timestamp: new Date().toISOString() };
  }

  async duplicate(id: string, userId: string): Promise<Slide> {
    const originalSlide = await this.findOne(id, userId);

    // Create a new slide with the same content but incremented order
    const duplicatedSlide = this.slideRepository.create({
      deckId: originalSlide.deckId,
      title: `${originalSlide.title} (Copy)`,
      content: originalSlide.content,
      speakerNotes: originalSlide.speakerNotes,
      slideType: originalSlide.slideType,
      slideOrder: originalSlide.slideOrder + 1,
      generatedBy: originalSlide.generatedBy,
    });

    // Update the order of all slides after the original slide
    await this.slideRepository.query(`
      UPDATE slides 
      SET slide_order = slide_order + 1 
      WHERE deck_id = $1 AND slide_order > $2
    `, [originalSlide.deckId, originalSlide.slideOrder]);

    return await this.slideRepository.save(duplicatedSlide);
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

    // Use transaction for atomic batch update to prevent race conditions
    await this.slideRepository.manager.transaction(async transactionalEntityManager => {
      // Build batch update cases for better performance
      const cases = slideIds.map((slideId, index) =>
        `WHEN id = '${slideId}' THEN ${index}`
      ).join(' ');
      
      const slideIdsStr = slideIds.map(id => `'${id}'`).join(',');
      
      // Single SQL query instead of multiple individual updates
      await transactionalEntityManager.query(`
        UPDATE slides
        SET slide_order = CASE ${cases} END,
            updated_at = NOW()
        WHERE id IN (${slideIdsStr})
      `);
    });
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
