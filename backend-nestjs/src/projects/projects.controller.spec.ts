import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from '../entities/project.entity';
import { UpdateProjectDescriptionDto } from './dto/update-project-description.dto';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

// Mock DecodedIdToken
const mockDecodedToken = {
  aud: 'mock-audience',
  auth_time: 1000,
  exp: 2000,
  firebase: {},
  iat: 1000,
  iss: 'mock-issuer',
  sub: 'mock-subject',
  uid: 'test-user-id',
} as DecodedIdToken;

// Mock authenticated user
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  firebase: mockDecodedToken,
} as AuthenticatedUser;

// Mock FirebaseAuthGuard
class MockFirebaseAuthGuard {
  canActivate() {
    return true;
  }
}

// Mock project
const mockProject = {
  id: 'test-project-id',
  name: 'Test Project',
  description: 'Test Description',
  userId: mockUser.uid,
  descriptionUpdatedAt: new Date(),
} as Project;

// Mock ProjectsService
const mockProjectsService = {
  findOne: jest.fn(),
  updateDescription: jest.fn(),
  getDescriptionUpdateTime: jest.fn(),
};

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    })
    .overrideGuard(FirebaseAuthGuard)
    .useClass(MockFirebaseAuthGuard)
    .compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateDescription', () => {
    it('should update project description and return success response', async () => {
      const projectId = 'test-project-id';
      const updateDto: UpdateProjectDescriptionDto = {
        description: 'Updated Description',
      };
      
      mockProjectsService.updateDescription.mockResolvedValue({
        ...mockProject,
        description: updateDto.description,
        descriptionUpdatedAt: new Date(),
      });
      
      const result = await controller.updateDescription(projectId, updateDto, mockUser);
      
      expect(mockProjectsService.updateDescription).toHaveBeenCalledWith(
        projectId,
        updateDto,
        mockUser.uid
      );
      expect(result.status).toBe('success');
      expect(result.project.description).toBe(updateDto.description);
      expect(result.lastUpdated).toBeDefined();
    });
    
    it('should handle not found error', async () => {
      const projectId = 'non-existent-id';
      const updateDto: UpdateProjectDescriptionDto = {
        description: 'Updated Description',
      };
      
      mockProjectsService.updateDescription.mockRejectedValue(
        new NotFoundException('Project not found')
      );
      
      await expect(
        controller.updateDescription(projectId, updateDto, mockUser)
      ).rejects.toThrow(NotFoundException);
    });
    
    it('should handle other errors with HttpException', async () => {
      const projectId = 'test-project-id';
      const updateDto: UpdateProjectDescriptionDto = {
        description: 'Updated Description',
      };
      
      mockProjectsService.updateDescription.mockRejectedValue(
        new Error('Database connection error')
      );
      
      try {
        await controller.updateDescription(projectId, updateDto, mockUser);
        fail('Expected HttpException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.getResponse()).toHaveProperty('retry', true);
      }
    });
  });

  describe('getDescriptionLastUpdated', () => {
    it('should return the last update timestamp', async () => {
      const projectId = 'test-project-id';
      const updateTime = new Date();
      
      mockProjectsService.getDescriptionUpdateTime.mockResolvedValue(updateTime);
      
      const result = await controller.getDescriptionLastUpdated(projectId, mockUser);
      
      expect(mockProjectsService.getDescriptionUpdateTime).toHaveBeenCalledWith(
        projectId,
        mockUser.uid
      );
      expect(result.lastUpdated).toBe(updateTime);
    });
    
    it('should return null if description has never been updated', async () => {
      const projectId = 'test-project-id';
      
      mockProjectsService.getDescriptionUpdateTime.mockResolvedValue(null);
      
      const result = await controller.getDescriptionLastUpdated(projectId, mockUser);
      
      expect(result.lastUpdated).toBeNull();
    });
  });
});