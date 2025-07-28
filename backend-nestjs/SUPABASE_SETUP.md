# 🚀 Supabase Database Setup for AI Pitch Deck Generator

## Step 1: Access Your Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your existing project (or create a new one if needed)

## Step 2: Get Your Database Connection String

1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select the **URI** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. **Important**: Replace `[YOUR-PASSWORD]` with your actual database password

## Step 3: Update Environment File

1. Open `backend-nestjs/.env`
2. Replace the `DATABASE_URL` line with your Supabase connection string:
   ```env
   DATABASE_URL=postgresql://postgres:your_actual_password@db.your_project_ref.supabase.co:5432/postgres
   ```

## Step 4: Run the Schema Setup

### Option A: Using Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste it into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see: "Database schema created successfully!"

### Option B: Using Command Line (if you have psql)

```bash
# Navigate to the backend directory
cd backend-nestjs

# Run the schema script
psql "your_supabase_connection_string" -f supabase-schema.sql
```

## Step 5: Verify Schema Creation

1. In Supabase dashboard, go to **Table Editor**
2. You should see these tables:
   - ✅ `projects`
   - ✅ `pitch_decks`
   - ✅ `slides`
   - ✅ `slide_templates`
   - ✅ `deck_versions`
   - ✅ `media_files`
   - ✅ `context_memory_events`
   - ✅ `learning_patterns`
   - ✅ `chat_contexts`
   - ✅ `user_ai_settings`

3. Check that `slide_templates` has default data:
   - Go to **Table Editor** → **slide_templates**
   - You should see 8 default templates (Title Slide, Problem Statement, etc.)

## Step 6: Test the Connection

```bash
# Start the NestJS server
npm run start:dev

# Look for this message in the logs:
# [TypeOrmModule] Database connected successfully
```

## Step 7: Optional - Set Up Row Level Security (RLS)

For production security, you can enable RLS:

1. In **Table Editor**, select a table
2. Click **Settings** → **Enable RLS**
3. Add policies as needed

Example policy for `projects` table:
```sql
-- Allow users to see only their own projects
CREATE POLICY "Users can view own projects" ON projects
FOR SELECT USING (auth.uid()::text = user_id);

-- Allow users to insert their own projects
CREATE POLICY "Users can insert own projects" ON projects
FOR INSERT WITH CHECK (auth.uid()::text = user_id);
```

## Troubleshooting

### Connection Issues
- ✅ Check your password is correct
- ✅ Ensure your IP is allowed (Supabase allows all by default)
- ✅ Verify the connection string format

### Schema Issues
- ✅ Make sure you ran the entire `supabase-schema.sql` script
- ✅ Check for any error messages in the SQL editor
- ✅ Verify extensions are enabled (`uuid-ossp`, `pg_trgm`)

### TypeORM Issues
- ✅ Ensure `synchronize: false` in production
- ✅ Check entity names match table names
- ✅ Verify all required environment variables are set

## Next Steps

After successful setup:

1. ✅ Database schema is ready
2. ✅ Default slide templates are loaded
3. 🚀 Start developing with `npm run start:dev`
4. 🧪 Test API endpoints
5. 📊 Monitor database usage in Supabase dashboard

## Database Schema Overview

```
projects (user projects)
├── pitch_decks (presentations)
│   ├── slides (individual slides)
│   └── deck_versions (version history)
├── media_files (images, documents)
├── context_memory_events (AI learning data)
├── learning_patterns (user preferences)
├── chat_contexts (chatbot sessions)
└── user_ai_settings (AI preferences)

slide_templates (reusable templates)
```

Your database is now ready for the AI Pitch Deck Generator! 🎉
