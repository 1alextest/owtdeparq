import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { Project } from '../entities/project.entity';
import { PitchDeck } from '../entities/pitch-deck.entity';
import { AuthService } from '../auth/auth.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: jest.Mocked<ProjectsService>;

  const mockUser: AuthenticatedUser = {
    uid: 'user-123',
    email: 'test@example.com',
    emailVerified: true,
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    firebase: {} as any,
  };

  const mockProject: Project = {
    id: 'project-123',
    name: 'Test Project',
    description: 'Test Description',
    userId: mockUser.uid,
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
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: {
            create: jest.fn(),
            findAllByUser: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getProjectDecks: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            extractTokenFromHeader: jest.fn(),
            validateUser: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a project', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'New Project',
        description: 'New Description',
      };

      service.create.mockResolvedValue(mockProject);

      const result = await controller.create(createProjectDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createProjectDto, mockUser.uid);
      expect(result).toEqual(mockProject);
    });
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const mockResponse = {
        projects: [mockProject],
        total: 1,
        hasMore: false,
      };

      service.findAllByUser.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockUser, '10', '0');

      expect(service.findAllByUser).toHaveBeenCalledWith(mockUser.uid, 10, 0);
      expect(result).toEqual(mockResponse);
    });

    it('should use default pagination parameters', async () => {
      const mockResponse = {
        projects: [mockProject],
        total: 1,
        hasMore: false,
      };

      service.findAllByUser.mockResolvedValue(mockResponse);

      await controller.findAll(mockUser);

      expect(service.findAllByUser).toHaveBeenCalledWith(mockUser.uid, 50, 0);
    });
  });

  describe('findOne', () => {
    it('should return a project', async () => {
      service.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne(mockProject.id, mockUser);

      expect(service.findOne).toHaveBeenCalledWith(mockProject.id, mockUser.uid);
      expect(result).toEqual(mockProject);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const updateProjectDto: UpdateProjectDto = {
        name: 'Updated Name',
      };

      const updatedProject = { ...mockProject, ...updateProjectDto };
      service.update.mockResolvedValue(updatedProject);

      const result = await controller.update(mockProject.id, updateProjectDto, mockUser);

      expect(service.update).toHaveBeenCalledWith(mockProject.id, updateProjectDto, mockUser.uid);
      expect(result).toEqual(updatedProject);
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(mockProject.id, mockUser);

      expect(service.remove).toHaveBeenCalledWith(mockProject.id, mockUser.uid);
    });
  });

  describe('getProjectDecks', () => {
    it('should return project decks', async () => {
      service.getProjectDecks.mockResolvedValue([mockDeck]);

      const result = await controller.getProjectDecks(mockProject.id, mockUser);

      expect(service.getProjectDecks).toHaveBeenCalledWith(mockProject.id, mockUser.uid);
      expect(result).toEqual([mockDeck]);
    });
  });
});