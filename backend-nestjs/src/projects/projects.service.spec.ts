import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { Project } from '../entities/project.entity';
import { PitchDeck } from '../entities/pitch-deck.entity';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepository: Repository<Project>;
  let deckRepository: Repository<PitchDeck>;

  const mockProject: Project = {
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test Description',
    userId: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    decks: [],
    contextEvents: [],
    learningPatterns: [],
  };

  const mockProjectRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockDeckRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: getRepositoryToken(PitchDeck),
          useValue: mockDeckRepository,
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
    it('should create a project', async () => {
      const createDto = { name: 'Test Project', description: 'Test Description' };
      const userId = 'test-user-id';

      mockProjectRepository.create.mockReturnValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(mockProject);

      const result = await service.create(createDto, userId);

      expect(mockProjectRepository.create).toHaveBeenCalledWith({
        name: createDto.name,
        description: createDto.description,
        userId,
      });
      expect(mockProjectRepository.save).toHaveBeenCalledWith(mockProject);
      expect(result).toBe(mockProject);
    });
  });

  describe('findAllByUser', () => {
    it('should return paginated projects', async () => {
      const userId = 'test-user-id';
      const projects = [mockProject];
      const total = 1;

      mockProjectRepository.findAndCount.mockResolvedValue([projects, total]);
      mockDeckRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAllByUser(userId, 10, 0);

      expect(result.projects).toBe(projects);
      expect(result.total).toBe(total);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('findOne', () => {
    it('should return a project', async () => {
      const projectId = 'test-project-id';
      const userId = 'test-user-id';

      mockProjectRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.findOne(projectId, userId);

      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId, userId },
        relations: ['decks'],
      });
      expect(result).toBe(mockProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      const projectId = 'non-existent-id';
      const userId = 'test-user-id';

      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(projectId, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const projectId = 'test-project-id';
      const userId = 'test-user-id';
      const updateDto = { name: 'Updated Project', description: 'Updated Description' };
      const updatedProject = { ...mockProject, ...updateDto };

      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(updatedProject);

      const result = await service.update(projectId, updateDto, userId);

      expect(result).toBe(updatedProject);
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      const projectId = 'test-project-id';
      const userId = 'test-user-id';

      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockProjectRepository.remove.mockResolvedValue(undefined);

      await service.remove(projectId, userId);

      expect(mockProjectRepository.remove).toHaveBeenCalledWith(mockProject);
    });
  });
});