import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

import { Project } from '../entities/project.entity';
import { PitchDeck } from '../entities/pitch-deck.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(PitchDeck)
    private deckRepository: Repository<PitchDeck>,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
    // Create a new project with the provided data
    const project = this.projectRepository.create({
      name: createProjectDto.name,
      userId,
    });

    return await this.projectRepository.save(project);
  }

  async findAllByUser(userId: string): Promise<Project[]> {
    return await this.projectRepository.find({
      where: { userId },
      relations: ['decks'],
      order: { createdAt: 'DESC' },
    });
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
    
    // Apply the updates from the DTO (only name field)
    if (updateProjectDto.name) {
      project.name = updateProjectDto.name;
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
  

}
