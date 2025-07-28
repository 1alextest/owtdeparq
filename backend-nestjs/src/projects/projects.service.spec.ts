import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { Project } from '../entities/project.entity';
import { PitchDeck } from '../entities/pitch-deck.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateProjectDescriptionDto } from './dto/update-project-description.dto';
import { NotFoundException } from '@nestjs/common';

// Mock repository factory
const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepository: Repository<Project>;
  let deckRepository: Repository<PitchDeck>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(PitchDeck),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectRepository = module.get<Repository<Project>>(getRepositoryToken(Project));
    deckRepository = module.get<Repository<PitchDeck>>(getRepositoryToken(PitchDeck));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project without description', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'Test Project',
      };
      const userId = 'test-user';
      
      const project = new Project();
      project.id = 'test-id';
      project.name = createProjectDto.name;
      project.userId = userId;
      
      jest.spyOn(projectRepository, 'create').mockReturnValue(project);
      jest.spyOn(projectRepository, 'save').mockResolvedValue(project);
      
      const result = await service.create(createProjectDto, userId);
      
      expect(projectRepository.create).toHaveBeenCalledWith({
        ...createProjectDto,
        userId,
      });
      expect(projectRepository.save).toHaveBeenCalledWith(project);
      expect(result).toEqual(project);
      expect(result.descriptionUpdatedAt).toBeUndefined();
    });
    
    it('should create a project with description and set descriptionUpdatedAt', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'Test Project',
        description: 'Test Description',
      };
      const userId = 'test-user';
      
      const project = new Project();
      project.id = 'test-id';
      project.name = createProjectDto.name;
      project.description = createProjectDto.description;
      project.userId = userId;
      
      jest.spyOn(projectRepository, 'create').mockReturnValue(project);
      jest.spyOn(projectRepository, 'save').mockResolvedValue({
        ...project,
        descriptionUpdatedAt: expect.any(Date),
      });
      
      const result = await service.create(createProjectDto, userId);
      
      expect(projectRepository.create).toHaveBeenCalledWith({
        ...createProjectDto,
        userId,
      });
      expect(projectRepository.save).toHaveBeenCalled();
      expect(result.descriptionUpdatedAt).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a project without changing description', async () => {
      const projectId = 'test-id';
      const userId = 'test-user';
      const updateProjectDto: UpdateProjectDto = {
        name: 'Updated Project',
      };
      
      const existingProject = new Project();
      existingProject.id = projectId;
      existingProject.name = 'Old Name';
      existingProject.description = 'Existing Description';
      existingProject.userId = userId;
      
      const updatedProject = new Project();
      updatedProject.id = projectId;
      updatedProject.name = updateProjectDto.name;
      updatedProject.description = existingProject.description;
      updatedProject.userId = userId;
      
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(existingProject);
      jest.spyOn(projectRepository, 'save').mockResolvedValue(updatedProject);
      
      const result = await service.update(projectId, updateProjectDto, userId);
      
      expect(projectRepository.findOne).toHaveBeenCalled();
      expect(projectRepository.save).toHaveBeenCalled();
      expect(result.name).toEqual(updateProjectDto.name);
      expect(result.description).toEqual(existingProject.description);
    });
    
    it('should update a project description and set descriptionUpdatedAt', async () => {
      const projectId = 'test-id';
      const userId = 'test-user';
      const updateProjectDto: UpdateProjectDto = {
        description: 'Updated Description',
      };
      
      const existingProject = new Project();
      existingProject.id = projectId;
      existingProject.name = 'Project Name';
      existingProject.description = 'Old Description';
      existingProject.userId = userId;
      
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(existingProject);
      jest.spyOn(projectRepository, 'save').mockImplementation(async (project) => {
        return project as Project;
      });
      
      const result = await service.update(projectId, updateProjectDto, userId);
      
      expect(projectRepository.findOne).toHaveBeenCalled();
      expect(projectRepository.save).toHaveBeenCalled();
      expect(result.description).toEqual(updateProjectDto.description);
      expect(result.descriptionUpdatedAt).toBeDefined();
    });
    
    it('should throw NotFoundException if project not found', async () => {
      const projectId = 'non-existent-id';
      const userId = 'test-user';
      const updateProjectDto: UpdateProjectDto = {
        name: 'Updated Project',
      };
      
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(null);
      
      await expect(service.update(projectId, updateProjectDto, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDescription', () => {
    it('should update only the description field', async () => {
      const projectId = 'test-id';
      const userId = 'test-user';
      const updateDescriptionDto: UpdateProjectDescriptionDto = {
        description: 'New Description',
      };
      
      const existingProject = new Project();
      existingProject.id = projectId;
      existingProject.name = 'Project Name';
      existingProject.description = 'Old Description';
      existingProject.userId = userId;
      
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(existingProject);
      jest.spyOn(projectRepository, 'update').mockResolvedValue(undefined);
      
      const result = await service.updateDescription(projectId, updateDescriptionDto, userId);
      
      expect(projectRepository.findOne).toHaveBeenCalled();
      expect(projectRepository.update).toHaveBeenCalledWith(
        { id: projectId },
        { 
          description: updateDescriptionDto.description,
          descriptionUpdatedAt: expect.any(Date)
        }
      );
      expect(result.description).toEqual(updateDescriptionDto.description);
      expect(result.descriptionUpdatedAt).toBeDefined();
    });
    
    it('should not update if description has not changed', async () => {
      const projectId = 'test-id';
      const userId = 'test-user';
      const existingDescription = 'Existing Description';
      const updateDescriptionDto: UpdateProjectDescriptionDto = {
        description: existingDescription,
      };
      
      const existingProject = new Project();
      existingProject.id = projectId;
      existingProject.name = 'Project Name';
      existingProject.description = existingDescription;
      existingProject.userId = userId;
      
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(existingProject);
      jest.spyOn(projectRepository, 'update');
      
      const result = await service.updateDescription(projectId, updateDescriptionDto, userId);
      
      expect(projectRepository.findOne).toHaveBeenCalled();
      expect(projectRepository.update).not.toHaveBeenCalled();
      expect(result.description).toEqual(existingDescription);
    });
  });

  describe('getDescriptionUpdateTime', () => {
    it('should return the description update timestamp', async () => {
      const projectId = 'test-id';
      const userId = 'test-user';
      const updateTime = new Date();
      
      const existingProject = new Project();
      existingProject.id = projectId;
      existingProject.name = 'Project Name';
      existingProject.description = 'Description';
      existingProject.userId = userId;
      existingProject.descriptionUpdatedAt = updateTime;
      
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(existingProject);
      
      const result = await service.getDescriptionUpdateTime(projectId, userId);
      
      expect(projectRepository.findOne).toHaveBeenCalled();
      expect(result).toEqual(updateTime);
    });
    
    it('should return null if description has never been updated', async () => {
      const projectId = 'test-id';
      const userId = 'test-user';
      
      const existingProject = new Project();
      existingProject.id = projectId;
      existingProject.name = 'Project Name';
      existingProject.description = 'Description';
      existingProject.userId = userId;
      existingProject.descriptionUpdatedAt = null;
      
      jest.spyOn(projectRepository, 'findOne').mockResolvedValue(existingProject);
      
      const result = await service.getDescriptionUpdateTime(projectId, userId);
      
      expect(projectRepository.findOne).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});