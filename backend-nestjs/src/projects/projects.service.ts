import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

import { Project } from '../entities/project.entity';
import { Presentation } from '../entities/presentation.entity';
import { PitchDeck } from '../entities/pitch-deck.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Presentation)
    private presentationRepository: Repository<Presentation>,
    @InjectRepository(PitchDeck)
    private deckRepository: Repository<PitchDeck>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    // Create a new project with the provided data
    const project = this.projectRepository.create({
      name: createProjectDto.name,
      description: createProjectDto.description,
      userId,
    });

    return await this.projectRepository.save(project);
  }

  async findAllByUser(userId: string, limit: number = 50, offset: number = 0): Promise<{
    projects: Project[];
    total: number;
    hasMore: boolean;
  }> {
    // Get projects with basic info first (no relations to avoid N+1)
    const [projects, total] = await this.projectRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    // If projects exist, get presentation counts separately to avoid N+1 query
    if (projects.length > 0) {
      const projectIds = projects.map(p => p.id);

      // Get presentation counts
      const presentationCounts = await this.presentationRepository
        .createQueryBuilder('presentation')
        .select('presentation.projectId', 'projectId')
        .addSelect('COUNT(presentation.id)', 'count')
        .where('presentation.projectId IN (:...projectIds)', { projectIds })
        .groupBy('presentation.projectId')
        .getRawMany();

      // Map presentation counts to projects
      const presentationCountMap = new Map(
        presentationCounts.map(pc => [pc.projectId, parseInt(pc.count)])
      );

      // Add presentation count to each project without loading full relations
      projects.forEach(project => {
        const presentationCount = presentationCountMap.get(project.id) || 0;
        (project as any).presentation_count = presentationCount;
        // Keep deck_count for backward compatibility, but it should be deprecated
        (project as any).deck_count = presentationCount;
      });
    }

    return {
      projects,
      total,
      hasMore: offset + projects.length < total
    };
  }

  async findOne(id: string, userId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, userId },
      relations: ['decks'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async getProjectDecks(projectId: string, userId: string): Promise<PitchDeck[]> {
    // First verify the project belongs to the user
    await this.findOne(projectId, userId);

    return await this.deckRepository.find({
      where: { projectId },
      relations: ['slides'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project> {
    const project = await this.findOne(id, userId);
    
    // Apply the updates from the DTO
    if (updateProjectDto.name) {
      project.name = updateProjectDto.name;
    }
    if (updateProjectDto.description !== undefined) {
      project.description = updateProjectDto.description;
    }
    
    return await this.projectRepository.save(project);
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.findOne(id, userId);
    await this.projectRepository.remove(project);
  }

  async verifyProjectOwnership(projectId: string, userId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, userId },
    });

    if (!project) {
      throw new ForbiddenException('Access denied to this project');
    }

    return project;
  }

  /**
   * Update project's updated_at timestamp to reflect activity
   */
  async touchProject(projectId: string): Promise<void> {
    await this.projectRepository.update(projectId, {
      updatedAt: new Date(),
    });
  }
}
