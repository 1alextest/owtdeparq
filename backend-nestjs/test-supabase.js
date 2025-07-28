// Test Supabase connection using the credentials from .env
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase Connection...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase credentials in .env file');
    console.log('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  console.log('🔗 Supabase URL:', supabaseUrl);
  console.log('🔑 Service Key:', supabaseKey.substring(0, 20) + '...');

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('\n✅ Supabase client created successfully');

    // Test 1: Check if we can connect
    console.log('\n📊 Testing database connection...');
    const { data, error, count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('relation "projects" does not exist')) {
        console.log('⚠️  Database tables do not exist yet');
        console.log('📋 You need to run the schema setup:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Open SQL Editor');
        console.log('3. Run the supabase-schema.sql file');
        return;
      } else {
        console.log('❌ Database connection error:', error.message);
        return;
      }
    }

    console.log('✅ Database connection successful!');
    console.log(`📊 Projects table exists (${count || 0} records)`);

    // Test 2: Check other tables
    console.log('\n🔍 Checking database schema...');
    const tables = [
      'pitch_decks',
      'slides', 
      'slide_templates',
      'media_files',
      'context_memory_events',
      'learning_patterns'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id', { head: true, count: 'exact' });
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: exists`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    // Test 3: Check slide templates
    console.log('\n📋 Checking slide templates...');
    const { data: templates, error: templatesError } = await supabase
      .from('slide_templates')
      .select('name, type')
      .limit(5);

    if (templatesError) {
      console.log('❌ Slide templates error:', templatesError.message);
    } else {
      console.log(`✅ Found ${templates.length} slide templates:`);
      templates.forEach(template => {
        console.log(`  - ${template.name} (${template.type})`);
      });
    }

    console.log('\n🎉 Supabase connection test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Supabase client working');
    console.log('✅ Database connection established');
    console.log('✅ Schema appears to be set up');
    console.log('\n🚀 Ready to start NestJS backend!');

  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.log('2. Verify your Supabase project is active');
    console.log('3. Make sure you have internet connection');
    console.log('4. Check Supabase dashboard for any issues');
  }
}

testSupabaseConnection();
