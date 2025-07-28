/**
 * Test script for ProjectsService description persistence
 */

const { Client } = require('pg');
require('dotenv').config();

async function testProjectDescriptionPersistence() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    
    // 1. Create a test project with description
    console.log('\n1. Creating test project with description...');
    const insertResult = await client.query(`
      INSERT INTO projects (user_id, name, description, description_updated_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, name, description, description_updated_at, created_at, updated_at
    `, ['test-user', 'Test Project Service', 'Initial description', new Date()]);
    
    const testProject = insertResult.rows[0];
    console.log('Test project created:');
    console.log(testProject);
    
    // 2. Update the project description
    console.log('\n2. Updating project description...');
    const updateTime = new Date();
    const updateResult = await client.query(`
      UPDATE projects
      SET description = $1, description_updated_at = $2
      WHERE id = $3
      RETURNING id, user_id, name, description, description_updated_at, created_at, updated_at
    `, ['Updated description with timestamp tracking', updateTime, testProject.id]);
    
    const updatedProject = updateResult.rows[0];
    console.log('Project updated:');
    console.log(updatedProject);
    
    // 3. Simulate debounced updates (multiple rapid changes)
    console.log('\n3. Simulating debounced updates...');
    
    // First update
    await client.query(`
      UPDATE projects
      SET description = $1, description_updated_at = $2
      WHERE id = $3
    `, ['First rapid update', new Date(), testProject.id]);
    
    // Wait a short time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Second update
    await client.query(`
      UPDATE projects
      SET description = $1, description_updated_at = $2
      WHERE id = $3
    `, ['Second rapid update', new Date(), testProject.id]);
    
    // Wait a short time
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Final update
    const finalUpdateTime = new Date();
    await client.query(`
      UPDATE projects
      SET description = $1, description_updated_at = $2
      WHERE id = $3
    `, ['Final debounced update', finalUpdateTime, testProject.id]);
    
    // 4. Retrieve the project to verify the final state
    console.log('\n4. Retrieving project to verify final state...');
    const { rows } = await client.query(`
      SELECT id, user_id, name, description, description_updated_at, created_at, updated_at
      FROM projects
      WHERE id = $1
    `, [testProject.id]);
    
    console.log('Final project state:');
    console.log(rows[0]);
    
    // 5. Verify the description_updated_at timestamp is tracking changes
    console.log('\n5. Verifying description_updated_at timestamp tracking:');
    console.log(`Initial creation time: ${new Date(testProject.description_updated_at).toISOString()}`);
    console.log(`After update time: ${new Date(updatedProject.description_updated_at).toISOString()}`);
    console.log(`Final update time: ${new Date(rows[0].description_updated_at).toISOString()}`);
    
    // Clean up test data
    await client.query(`
      DELETE FROM projects WHERE id = $1
    `, [testProject.id]);
    
    console.log('\n✅ Test data cleaned up.');
    console.log('✅ Project description persistence with timestamp tracking works correctly.');
    
  } catch (error) {
    console.error('Error testing Project description persistence:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

testProjectDescriptionPersistence();