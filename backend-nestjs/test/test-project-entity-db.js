/**
 * Test script for Project entity database operations
 */

const { Client } = require('pg');
require('dotenv').config();

async function testProjectEntity() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    
    // Create a test project with description
    console.log('\nCreating test project with description...');
    const insertResult = await client.query(`
      INSERT INTO projects (user_id, name, description, description_updated_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, name, description, description_updated_at, created_at, updated_at
    `, ['test-user', 'Test Project Entity', 'This is a test description for the Project entity', new Date()]);
    
    const testProject = insertResult.rows[0];
    console.log('Test project created:');
    console.log(testProject);
    
    // Update the project description
    console.log('\nUpdating project description...');
    const updateResult = await client.query(`
      UPDATE projects
      SET description = $1, description_updated_at = $2
      WHERE id = $3
      RETURNING id, user_id, name, description, description_updated_at, created_at, updated_at
    `, ['Updated description with validation applied', new Date(), testProject.id]);
    
    const updatedProject = updateResult.rows[0];
    console.log('Project updated:');
    console.log(updatedProject);
    
    // Retrieve the project
    console.log('\nRetrieving project...');
    const { rows } = await client.query(`
      SELECT id, user_id, name, description, description_updated_at, created_at, updated_at
      FROM projects
      WHERE id = $1
    `, [testProject.id]);
    
    console.log('Retrieved project:');
    console.log(rows[0]);
    
    // Clean up test data
    await client.query(`
      DELETE FROM projects WHERE id = $1
    `, [testProject.id]);
    
    console.log('\n✅ Test data cleaned up.');
    console.log('✅ Project entity with description field works correctly with the database.');
    
  } catch (error) {
    console.error('Error testing Project entity:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

testProjectEntity();