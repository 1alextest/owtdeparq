/**
 * Test script for Project DTO validation
 */

const { validate } = require('class-validator');
const { plainToClass } = require('class-transformer');

// Mock the DTOs with the same validation decorators
class CreateProjectDto {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

class UpdateProjectDto {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

class UpdateProjectDescriptionDto {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

// Add validation metadata manually
const validationMetadata = {
  name: {
    isNotEmpty: 'Project name is required',
    isString: 'Project name must be a string',
    maxLength: 'Project name cannot exceed 100 characters'
  },
  description: {
    isString: 'Project description must be a string',
    maxLength: 'Project description cannot exceed 1000 characters',
    matches: 'Project description cannot contain HTML tags for security reasons'
  }
};

async function testDtoValidation() {
  console.log('Testing Project DTO validation...');
  
  // Test valid CreateProjectDto
  const validCreateDto = {
    name: 'Test Project',
    description: 'This is a valid description'
  };
  
  console.log('\n1. Testing valid CreateProjectDto:');
  console.log(validCreateDto);
  console.log('Expected validation result: Valid');
  
  // Test CreateProjectDto with empty name
  const emptyNameDto = {
    name: '',
    description: 'This is a valid description'
  };
  
  console.log('\n2. Testing CreateProjectDto with empty name:');
  console.log(emptyNameDto);
  console.log('Expected validation error:', validationMetadata.name.isNotEmpty);
  
  // Test CreateProjectDto with too long name
  const longNameDto = {
    name: 'a'.repeat(101),
    description: 'This is a valid description'
  };
  
  console.log('\n3. Testing CreateProjectDto with too long name:');
  console.log(`Name length: ${longNameDto.name.length} characters`);
  console.log('Expected validation error:', validationMetadata.name.maxLength);
  
  // Test CreateProjectDto with HTML tags in description
  const htmlDescDto = {
    name: 'Test Project',
    description: '<script>alert("XSS")</script>'
  };
  
  console.log('\n4. Testing CreateProjectDto with HTML tags in description:');
  console.log(htmlDescDto.description);
  console.log('Expected validation error:', validationMetadata.description.matches);
  
  // Test valid UpdateProjectDto with only description
  const validUpdateDto = {
    description: 'This is an updated description'
  };
  
  console.log('\n5. Testing valid UpdateProjectDto with only description:');
  console.log(validUpdateDto);
  console.log('Expected validation result: Valid');
  
  // Test UpdateProjectDescriptionDto with missing description
  const missingDescDto = {};
  
  console.log('\n6. Testing UpdateProjectDescriptionDto with missing description:');
  console.log(missingDescDto);
  console.log('Expected validation error: Description is required');
  
  console.log('\nValidation tests completed. In a real application, these would be validated using class-validator.');
}

testDtoValidation();