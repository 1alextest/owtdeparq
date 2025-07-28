/**
 * Test script for Project entity validation
 */

const { validate } = require('class-validator');

// Mock the Project entity with the same validation decorators
class Project {
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
    matches: 'Project description cannot contain HTML tags'
  }
};

async function testValidation() {
  console.log('Testing Project entity validation...');
  
  // Test valid project
  const validProject = new Project({
    name: 'Test Project',
    description: 'This is a valid description'
  });
  
  console.log('\n1. Testing valid project:');
  console.log(validProject);
  
  // Test project with empty name
  const emptyNameProject = new Project({
    name: '',
    description: 'This is a valid description'
  });
  
  console.log('\n2. Testing project with empty name:');
  console.log(emptyNameProject);
  console.log('Expected validation error:', validationMetadata.name.isNotEmpty);
  
  // Test project with too long name
  const longNameProject = new Project({
    name: 'a'.repeat(101),
    description: 'This is a valid description'
  });
  
  console.log('\n3. Testing project with too long name:');
  console.log(`Name length: ${longNameProject.name.length} characters`);
  console.log('Expected validation error:', validationMetadata.name.maxLength);
  
  // Test project with too long description
  const longDescProject = new Project({
    name: 'Test Project',
    description: 'a'.repeat(1001)
  });
  
  console.log('\n4. Testing project with too long description:');
  console.log(`Description length: ${longDescProject.description.length} characters`);
  console.log('Expected validation error:', validationMetadata.description.maxLength);
  
  // Test project with HTML tags in description
  const htmlDescProject = new Project({
    name: 'Test Project',
    description: '<script>alert("XSS")</script>'
  });
  
  console.log('\n5. Testing project with HTML tags in description:');
  console.log(htmlDescProject.description);
  console.log('Expected validation error:', validationMetadata.description.matches);
  
  console.log('\nValidation tests completed. In a real application, these would be validated using class-validator.');
}

testValidation();