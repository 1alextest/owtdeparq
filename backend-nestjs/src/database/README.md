# Database Setup and Migrations

This directory contains the TypeORM configuration and migrations for the AI Pitch Deck Generator backend.

## Files

- `data-source.ts` - TypeORM DataSource configuration for migrations
- `migrations/` - Database migration files
- `migrations/1704067200000-InitialSchema.ts` - Initial schema migration with all tables

## Database Schema

The application uses the following tables:

### Core Tables
- `projects` - User projects
- `pitch_decks` - Pitch decks within projects  
- `slides` - Individual slides within decks
- `slide_templates` - Reusable slide templates

### AI & Learning Tables
- `user_ai_settings` - User AI preferences and settings
- `project_context_memory` - Context memory events for AI learning
- `user_learning_patterns` - AI learning patterns per user/scope

### Supporting Tables
- `media_files` - Uploaded and AI-suggested media files
- `deck_versions` - Version history for decks
- `chatbot_conversations` - Chatbot conversation history

## Running Migrations

### Prerequisites
1. Ensure `DATABASE_URL` is set in your `.env` file
2. Supabase project must be running and accessible

### Commands

```bash
# Show migration status
npm run migration:show

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration (after entity changes)
npm run migration:generate src/database/migrations/MigrationName

# Create empty migration file
npm run migration:create src/database/migrations/MigrationName
```

## Initial Setup

1. **Set up Supabase connection** in `.env`:
   ```
   DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   ```

2. **Run the initial migration**:
   ```bash
   npm run migration:run
   ```

3. **Verify the setup**:
   ```bash
   npm run migration:show
   ```

## Troubleshooting

### Connection Issues
- Verify Supabase project is running
- Check DATABASE_URL format
- Ensure your IP is allowed in Supabase settings
- Confirm database password is correct

### Migration Issues
- Check TypeORM entity definitions match migration
- Verify all foreign key relationships
- Ensure proper indexes are created

## Schema Overview

```
projects (1:N) pitch_decks (1:N) slides
    |                |
    |                +-- (1:N) deck_versions
    |                +-- (1:N) chatbot_conversations
    |                +-- (1:N) project_context_memory
    |
    +-- (1:N) project_context_memory
    +-- (1:N) user_learning_patterns

slide_templates (standalone)
media_files (references projects/slides)
user_ai_settings (per user)
```

All tables include proper indexes for performance and foreign key constraints for data integrity.