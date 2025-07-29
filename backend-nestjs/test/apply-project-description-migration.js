/**
 * Script to apply the project description migration directly
 */

const { Client } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Checking if description column exists...');
    const { rows: columns } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'description'
    `);
    
    if (columns.length > 0) {
      console.log('✅ Description column already exists, skipping creation.');
    } else {
      console.log('Adding description column to projects table...');
      await client.query(`
        ALTER TABLE "projects" 
        ADD COLUMN "description" TEXT
      `);
      console.log('✅ Description column added successfully.');
    }
    
    console.log('Checking if description_updated_at column exists...');
    const { rows: timestampColumns } = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'description_updated_at'
    `);
    
    if (timestampColumns.length > 0) {
      console.log('✅ Description_updated_at column already exists, skipping creation.');
    } else {
      console.log('Adding description_updated_at column to projects table...');
      await client.query(`
        ALTER TABLE "projects" 
        ADD COLUMN "description_updated_at" TIMESTAMP WITH TIME ZONE
      `);
      console.log('✅ Description_updated_at column added successfully.');
    }
    
    // Insert a test record to verify the columns work
    console.log('Inserting test record...');
    const { rows: testProject } = await client.query(`
      INSERT INTO projects (user_id, name, description, description_updated_at)
      VALUES ('test-user', 'Test Project with Description', 'This is a test description', NOW())
      RETURNING id, name, description, description_updated_at
    `);
    
    console.log('Test record inserted:');
    console.log(testProject[0]);
    
    // Clean up test data
    await client.query(`
      DELETE FROM projects WHERE id = $1
    `, [testProject[0].id]);
    
    console.log('✅ Test record cleaned up.');
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

applyMigration();
