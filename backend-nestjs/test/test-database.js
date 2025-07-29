// Test database connection to Supabase
const { Client } = require('pg');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🧪 Testing Supabase Database Connection...\n');

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL not found in .env file');
    console.log('Please update your .env file with your Supabase connection string');
    return;
  }

  if (databaseUrl.includes('[YOUR-PASSWORD]') || databaseUrl.includes('[PROJECT-REF]')) {
    console.log('❌ Please update DATABASE_URL with your actual Supabase credentials');
    console.log('Current value:', databaseUrl);
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to Supabase successfully!');

    // Test 1: Check if tables exist
    console.log('\n📊 Checking database schema...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'projects', 'pitch_decks', 'slides', 'slide_templates', 
        'deck_versions', 'media_files', 'context_memory_events', 
        'learning_patterns', 'chat_contexts', 'user_ai_settings'
      )
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const expectedTables = [
      'chat_contexts', 'context_memory_events', 'deck_versions', 
      'learning_patterns', 'media_files', 'pitch_decks', 
      'projects', 'slide_templates', 'slides', 'user_ai_settings'
    ];

    console.log('Expected tables:', expectedTables.length);
    console.log('Found tables:', tablesResult.rows.length);
    
    expectedTables.forEach(table => {
      const exists = tablesResult.rows.some(row => row.table_name === table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    });

    // Test 2: Check slide templates
    console.log('\n📋 Checking slide templates...');
    const templatesResult = await client.query('SELECT COUNT(*) as count FROM slide_templates');
    const templateCount = parseInt(templatesResult.rows[0].count);
    console.log(`Found ${templateCount} slide templates`);
    
    if (templateCount >= 8) {
      console.log('✅ Default slide templates are loaded');
    } else {
      console.log('⚠️  Default slide templates may be missing');
    }

    // Test 3: Check extensions
    console.log('\n🔧 Checking database extensions...');
    const extensionsResult = await client.query(`
      SELECT extname FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pg_trgm')
      ORDER BY extname
    `);
    
    const extensions = extensionsResult.rows.map(row => row.extname);
    console.log(`  ${extensions.includes('uuid-ossp') ? '✅' : '❌'} uuid-ossp`);
    console.log(`  ${extensions.includes('pg_trgm') ? '✅' : '❌'} pg_trgm`);

    console.log('\n🎉 Database test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run start:dev');
    console.log('2. Check server logs for "Database connected successfully"');
    console.log('3. Test API endpoints');

  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your DATABASE_URL in .env file');
    console.log('2. Verify your Supabase password is correct');
    console.log('3. Ensure you ran the supabase-schema.sql script');
    console.log('4. Check Supabase dashboard for any issues');
  } finally {
    await client.end();
  }
}

testDatabaseConnection();
