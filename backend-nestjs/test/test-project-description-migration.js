/**
 * Test script for project description migration
 * 
 * This script tests the migration that adds the description and description_updated_at
 * columns to the projects table.
 */

const { Client } = require('pg');
require('dotenv').config();

async function testMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Checking projects table structure...');
    const { rows } = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'projects'
      ORDER BY ordinal_position
    `);
    
    console.log('Projects table columns:');
    console.table(rows);
    
    // Check if description columns exist
    const descriptionColumn = rows.find(row => row.column_name === 'description');
    const descriptionUpdatedAtColumn = rows.find(row => row.column_name === 'description_updated_at');
    
    if (descriptionColumn && descriptionUpdatedAtColumn) {
      console.log('✅ Migration successful! Both columns were added correctly.');
      console.log(`   - description: ${descriptionColumn.data_type} (nullable: ${descriptionColumn.is_nullable})`);
      console.log(`   - description_updated_at: ${descriptionUpdatedAtColumn.data_type} (nullable: ${descriptionUpdatedAtColumn.is_nullable})`);
    } else {
      console.error('❌ Migration failed! One or both columns are missing:');
      console.log(`   - description: ${descriptionColumn ? 'Present' : 'Missing'}`);
      console.log(`   - description_updated_at: ${descriptionUpdatedAtColumn ? 'Present' : 'Missing'}`);
    }
    
    // Test inserting data with description
    console.log('\nTesting data insertion with description...');
    const testProjectId = await client.query(`
      INSERT INTO projects (user_id, name, description, description_updated_at)
      VALUES ('test-user', 'Test Project with Description', 'This is a test description', NOW())
      RETURNING id
    `);
    
    // Retrieve the inserted data
    const testProject = await client.query(`
      SELECT * FROM projects WHERE id = $1
    `, [testProjectId.rows[0].id]);
    
    console.log('Test project data:');
    console.log(testProject.rows[0]);
    
    // Clean up test data
    await client.query(`
      DELETE FROM projects WHERE id = $1
    `, [testProjectId.rows[0].id]);
    
    console.log('✅ Test data insertion successful and cleaned up.');
    
  } catch (error) {
    console.error('Error testing migration:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

testMigration();