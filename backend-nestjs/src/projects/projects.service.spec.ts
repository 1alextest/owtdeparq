import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { ProjectsService } from './projects.service';
import { Project } from '../entities/project.entity';
import { PitchDeck } from '../entities/pitch-deck.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepository: jest.Mocked<Repository<Project>>;
  let deckRepository: jest.Mocked<Repository<PitchDeck>>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockProject: Project = {
    id: 'project-123',
    name: 'Test Project',
    description: 'Test Description',
    userId: mockUser.id,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    descriptionUpdatedAt: null,
    decks: [],
    contextEvents: [],
    learningPatterns: [],
  };

  const mockDeck: PitchDeck = {
    id: 'deck-123',
    projectId: mockProject.id,
    title: 'Test Deck',
    mode: 'free',
    generationData: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    project: mockProject,
    slides: [],
    versions: [],
    chatContexts: [],
    contextEvents: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PitchDeck),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectRepository = module.get(getRepositoryToken(Project));
    deckRepository = module.get(getRepositoryToken(PitchDeck));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new project successfully', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'New Project',
        description: 'New Description',
      };

      const createdProject = { ...mockProject, ...createProjectDto };

      projectRepository.create.mockReturnValue(createdProject);
      projectRepository.save.mockResolvedValue(createdProject);

      const result = await service.create(createProjectDto, mockUser.id);

      expect(projectRepository.create).toHaveBeenCalledWith({
        name: createProjectDto.name,
        description: createProjectDto.description,
        userId: mockUser.id,
      });
      expect(projectRepository.save).toHaveBeenCalledWith(createdProject);
      expect(result).toEqual(createdProject);
    });

    it('should create project without description', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'New Project',
      };

      const createdProject = { ...mockProject, ...createProjectDto, description: undefined };

      projectRepository.create.mockReturnValue(createdProject);
      projectRepository.save.mockResolvedValue(createdProject);

      const result = await service.create(createProjectDto, mockUser.id);

      expect(projectRepository.create).toHaveBeenCalledWith({
        name: createProjectDto.name,
        description: undefined,
        userId: mockUser.id,
      });
      expect(result).toEqual(createdProject);
    });

    it('should handle database errors during creation', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'New Project',
        description: 'New Description',
      };

      projectRepository.create.mockReturnValue(mockProject);
      projectRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createProjectDto, mockUser.id)).rejects.toThrow('Database error');
    });
  });

  describe('findAllByUser', () => {
    it('should return paginated projects with deck counts', async () => {
      const projects = [mockProject];
      const total = 1;

      projectRepository.findAndCount.mockResolvedValue([projects, total]);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { projectId: mockProject.id, count: '2' }
        ]),
      } as any;

      deckRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAllByUser(mockUser.id, 10, 0);

      expect(projectRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 0,
      });

      expect(result).toEqual({
        projects: expect.arrayContaining([
          expect.objectContaining({
            ...mockProject,
            deckCount: 2,
          })
        ]),
        total: 1,
        hasMore: false,
      });
    });

    it('should return empty result when no projects found', async () => {
      projectRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllByUser(mockUser.id, 10, 0);

      expect(result).toEqual({
        projects: [],
        total: 0,
        hasMore: false,
      });
    });

    it('should handle pagination correctly', async () => {
      const projects = Array(5).fill(null).map((_, i) => ({
        ...mockProject,
        id: `project-${i}`,
      }));

      projectRepository.findAndCount.mockResolvedValue([projects, 15]);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      } as any;

      deckRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAllByUser(mockUser.id, 5, 10);

      expect(result.hasMore).toBe(false); // 10 + 5 = 15, no more items
      expect(result.total).toBe(15);
    });

    it('should use default pagination parameters', async () => {
      projectRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllByUser(mockUser.id);

      expect(projectRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        order: { createdAt: 'DESC' },
        take: 50, // default limit
        skip: 0,  // default offset
      });
    });
  });

  describe('findOne', () => {
    it('should return project when found', async () => {
      const projectWithDecks = { ...mockProject, decks: [mockDeck] };
      projectRepository.findOne.mockResolvedValue(projectWithDecks);

      const result = await service.findOne(mockProject.id, mockUser.id);

      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProject.id, userId: mockUser.id },
        relations: ['decks'],
      });
      expect(result).toEqual(projectWithDecks);
    });

    it('should throw NotFoundException when project not found', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent', mockUser.id))
        .rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent', mockUser.id))
        .rejects.toThrow('Project not found');
    });

    it('should throw NotFoundException when project belongs to different user', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockProject.id, 'different-user'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getProjectDecks', () => {
    it('should return project decks when project exists', async () => {
      const projectWithDecks = { ...mockProject, decks: [mockDeck] };
      projectRepository.findOne.mockResolvedValue(projectWithDecks);
      deckRepository.find.mockResolvedValue([mockDeck]);

      const result = await service.getProjectDecks(mockProject.id, mockUser.id);

      expect(deckRepository.find).toHaveBeenCalledWith({
        where: { projectId: mockProject.id },
        relations: ['slides'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockDeck]);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.getProjectDecks('non-existent', mockUser.id))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update project name and description', async () => {
      const updateDto: UpdateProjectDto = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      const updatedProject = { ...mockProject, ...updateDto };

      projectRepository.findOne.mockResolvedValue(mockProject);
      projectRepository.save.mockResolvedValue(updatedProject);

      const result = await service.update(mockProject.id, updateDto, mockUser.id);

      expect(projectRepository.save).toHaveBeenCalledWith({
        ...mockProject,
        name: updateDto.name,
        description: updateDto.description,
      });
      expect(result).toEqual(updatedProject);
    });

    it('should update only name when description not provided', async () => {
      const updateDto: UpdateProjectDto = {
        name: 'Updated Name',
      };

      projectRepository.findOne.mockResolvedValue(mockProject);
      projectRepository.save.mockResolvedValue({ ...mockProject, name: updateDto.name });

      await service.update(mockProject.id, updateDto, mockUser.id);

      expect(projectRepository.save).toHaveBeenCalledWith({
        ...mockProject,
        name: updateDto.name,
      });
    });

    it('should handle empty description update', async () => {
      const updateDto: UpdateProjectDto = {
        description: '',
      };

      projectRepository.findOne.mockResolvedValue(mockProject);
      projectRepository.save.mockResolvedValue({ ...mockProject, description: '' });

      await service.update(mockProject.id, updateDto, mockUser.id);

      expect(projectRepository.save).toHaveBeenCalledWith({
        ...mockProject,
        description: '',
      });
    });

    it('should throw NotFoundException when project does not exist', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', {}, mockUser.id))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove project successfully', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);
      projectRepository.remove.mockResolvedValue(mockProject);

      await service.remove(mockProject.id, mockUser.id);

      expect(projectRepository.remove).toHaveBeenCalledWith(mockProject);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockUser.id))
        .rejects.toThrow(NotFoundException);
    });

    it('should handle database errors during removal', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);
      projectRepository.remove.mockRejectedValue(new Error('Database error'));

      await expect(service.remove(mockProject.id, mockUser.id))
        .rejects.toThrow('Database error');
    });
  });

  describe('verifyProjectOwnership', () => {
    it('should return project when user owns it', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.verifyProjectOwnership(mockProject.id, mockUser.id);

      expect(projectRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProject.id, userId: mockUser.id },
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw ForbiddenException when user does not own project', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyProjectOwnership(mockProject.id, 'different-user'))
        .rejects.toThrow(ForbiddenException);
      await expect(service.verifyProjectOwnership(mockProject.id, 'different-user'))
        .rejects.toThrow('Access denied to this project');
    });

    it('should throw ForbiddenException when project does not exist', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyProjectOwnership('non-existent', mockUser.id))
        .rejects.toThrow(ForbiddenException);
    });
  });
});