import { validate } from 'class-validator';
import { Project } from './project.entity';

describe('Project Entity', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project();
    project.id = 'test-id';
    project.userId = 'user-123';
    project.name = 'Test Project';
    project.description = 'Test Description';
    project.createdAt = new Date();
    project.updatedAt = new Date();
    project.decks = [];
    project.contextEvents = [];
    project.learningPatterns = [];
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const errors = await validate(project);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when userId is empty', async () => {
      project.userId = '';
      const errors = await validate(project);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('userId');
    });

    it('should fail validation when name is empty', async () => {
      project.name = '';
      const errors = await validate(project);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('should pass validation when description is null', async () => {
      project.description = null;
      const errors = await validate(project);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation when description is undefined', async () => {
      project.description = undefined;
      const errors = await validate(project);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when userId is not a string', async () => {
      (project as any).userId = 123;
      const errors = await validate(project);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('userId');
    });

    it('should fail validation when name is not a string', async () => {
      (project as any).name = 123;
      const errors = await validate(project);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });
  });

  describe('entity structure', () => {
    it('should have correct property types', () => {
      expect(typeof project.id).toBe('string');
      expect(typeof project.userId).toBe('string');
      expect(typeof project.name).toBe('string');
      expect(typeof project.description).toBe('string');
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
      expect(Array.isArray(project.decks)).toBe(true);
      expect(Array.isArray(project.contextEvents)).toBe(true);
      expect(Array.isArray(project.learningPatterns)).toBe(true);
    });

    it('should allow optional description', () => {
      delete project.description;
      expect(project.description).toBeUndefined();
    });

    it('should allow optional descriptionUpdatedAt', () => {
      project.descriptionUpdatedAt = new Date();
      expect(project.descriptionUpdatedAt).toBeInstanceOf(Date);
      
      delete project.descriptionUpdatedAt;
      expect(project.descriptionUpdatedAt).toBeUndefined();
    });
  });
});