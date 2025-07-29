import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { Project } from '../entities/project.entity';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockUser: AuthenticatedUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    firebase: {} as any,
  };

  const mockProject: Project = {
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test Description',
    userId: mockUser.uid,
    createdAt: new Date(),
    updatedAt: new Date(),
    decks: [],
    contextEvents: [],
    learningPatterns: [],
  };

  const mockProjectsService = {
    create: jest.fn(),
    findAllByUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getProjectDecks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a project', async () => {
      const createDto = { name: 'Test Project', description: 'Test Description' };
      mockProjectsService.create.mockResolvedValue(mockProject);

      const result = await controller.create(createDto, mockUser);

      expect(mockProjectsService.create).toHaveBeenCalledWith(createDto, mockUser.uid);
      expect(result).toBe(mockProject);
    });
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const paginatedResult = {
        projects: [mockProject],
        total: 1,
        hasMore: false,
      };
      mockProjectsService.findAllByUser.mockResolvedValue(paginatedResult);

      const result = await controller.findAll(mockUser, '10', '0');

      expect(mockProjectsService.findAllByUser).toHaveBeenCalledWith(mockUser.uid, 10, 0);
      expect(result).toBe(paginatedResult);
    });
  });

  describe('findOne', () => {
    it('should return a project', async () => {
      mockProjectsService.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne('test-id', mockUser);

      expect(mockProjectsService.findOne).toHaveBeenCalledWith('test-id', mockUser.uid);
      expect(result).toBe(mockProject);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const updateDto = { name: 'Updated Project', description: 'Updated Description' };
      const updatedProject = { ...mockProject, ...updateDto };
      mockProjectsService.update.mockResolvedValue(updatedProject);

      const result = await controller.update('test-id', updateDto, mockUser);

      expect(mockProjectsService.update).toHaveBeenCalledWith('test-id', updateDto, mockUser.uid);
      expect(result).toBe(updatedProject);
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      mockProjectsService.remove.mockResolvedValue(undefined);

      await controller.remove('test-id', mockUser);

      expect(mockProjectsService.remove).toHaveBeenCalledWith('test-id', mockUser.uid);
    });
  });

  describe('getProjectDecks', () => {
    it('should return project decks', async () => {
      const mockDecks = [];
      mockProjectsService.getProjectDecks.mockResolvedValue(mockDecks);

      const result = await controller.getProjectDecks('test-id', mockUser);

      expect(mockProjectsService.getProjectDecks).toHaveBeenCalledWith('test-id', mockUser.uid);
      expect(result).toBe(mockDecks);
    });
  });
});