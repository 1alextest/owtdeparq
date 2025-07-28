import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProjectDto } from './create-project.dto';
import { UpdateProjectDto } from './update-project.dto';
import { UpdateProjectDescriptionDto } from './update-project-description.dto';

describe('Project DTOs', () => {
  describe('CreateProjectDto', () => {
    it('should validate a valid project', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        name: 'Test Project',
        description: 'This is a valid description'
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate a project without description', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        name: 'Test Project'
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with empty name', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        name: '',
        description: 'This is a valid description'
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with too long name', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        name: 'a'.repeat(101),
        description: 'This is a valid description'
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should fail validation with too long description', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        name: 'Test Project',
        description: 'a'.repeat(1001)
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should fail validation with HTML tags in description', async () => {
      const dto = plainToInstance(CreateProjectDto, {
        name: 'Test Project',
        description: '<script>alert("XSS")</script>'
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('matches');
    });
  });

  describe('UpdateProjectDto', () => {
    it('should validate a valid update', async () => {
      const dto = plainToInstance(UpdateProjectDto, {
        name: 'Updated Project',
        description: 'This is an updated description'
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate a partial update with only description', async () => {
      const dto = plainToInstance(UpdateProjectDto, {
        description: 'This is an updated description'
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with HTML tags in description', async () => {
      const dto = plainToInstance(UpdateProjectDto, {
        description: '<script>alert("XSS")</script>'
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('matches');
    });
  });

  describe('UpdateProjectDescriptionDto', () => {
    it('should validate a valid description update', async () => {
      const dto = plainToInstance(UpdateProjectDescriptionDto, {
        description: 'This is a valid description update'
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with missing description', async () => {
      const dto = plainToInstance(UpdateProjectDescriptionDto, {});
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with too long description', async () => {
      const dto = plainToInstance(UpdateProjectDescriptionDto, {
        description: 'a'.repeat(1001)
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should fail validation with HTML tags in description', async () => {
      const dto = plainToInstance(UpdateProjectDescriptionDto, {
        description: '<script>alert("XSS")</script>'
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('matches');
    });
  });
});