import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePresentationDto } from './dto/create-presentation.dto';
import { UpdatePresentationDto } from './dto/update-presentation.dto';
import { Presentation } from '../entities/presentation.entity';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class PresentationsService {
  constructor(
    @InjectRepository(Presentation)
    private presentationRepository: Repository<Presentation>,
    private projectsService: ProjectsService,
  ) {}

  async create(createPresentationDto: CreatePresentationDto, userId: string): Promise<Presentation> {
    // Verify project ownership
    await this.projectsService.verifyProjectOwnership(createPresentationDto.projectId, userId);

    const presentation = this.presentationRepository.create(createPresentationDto);
    const savedPresentation = await this.presentationRepository.save(presentation);
    
    // Update project's updated_at timestamp to reflect activity
    await this.projectsService.touchProject(createPresentationDto.projectId);
    
    return savedPresentation;
  }

  async findAllByProject(projectId: string, userId: string): Promise<Presentation[]> {
    // Verify project ownership
    await this.projectsService.verifyProjectOwnership(projectId, userId);

    return await this.presentationRepository.find({
      where: { projectId },
      relations: ['decks'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Presentation> {
    const presentation = await this.presentationRepository.findOne({
      where: { id },
      relations: ['project', 'decks'],
    });

    if (!presentation) {
      throw new NotFoundException('Presentation not found');
    }

    // Verify ownership through project
    await this.projectsService.verifyProjectOwnership(presentation.projectId, userId);

    return presentation;
  }

  async update(id: string, updatePresentationDto: UpdatePresentationDto, userId: string): Promise<Presentation> {
    const presentation = await this.findOne(id, userId);

    Object.assign(presentation, updatePresentationDto);
    const updatedPresentation = await this.presentationRepository.save(presentation);
    
    // Update project's updated_at timestamp to reflect activity
    await this.projectsService.touchProject(presentation.projectId);
    
    return updatedPresentation;
  }

  async remove(id: string, userId: string): Promise<void> {
    const presentation = await this.findOne(id, userId);
    
    // Update project's updated_at timestamp to reflect activity
    await this.projectsService.touchProject(presentation.projectId);
    
    await this.presentationRepository.remove(presentation);
  }

  /**
   * Verify presentation ownership by user
   */
  async verifyPresentationOwnership(presentationId: string, userId: string): Promise<Presentation> {
    const presentation = await this.presentationRepository.findOne({
      where: { id: presentationId },
      relations: ['project'],
    });

    if (!presentation) {
      throw new NotFoundException('Presentation not found');
    }

    if (presentation.project.userId !== userId) {
      throw new ForbiddenException('Access denied to this presentation');
    }

    return presentation;
  }
}
