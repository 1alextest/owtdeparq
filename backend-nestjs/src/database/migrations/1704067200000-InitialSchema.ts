import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1704067200000 implements MigrationInterface {
  name = 'InitialSchema1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create projects table
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" character varying(255) NOT NULL,
        "name" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_projects" PRIMARY KEY ("id")
      )
    `);

    // Create index for projects
    await queryRunner.query(`CREATE INDEX "idx_projects_user_id" ON "projects" ("user_id")`);

    // Create pitch_decks table
    await queryRunner.query(`
      CREATE TABLE "pitch_decks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "project_id" uuid NOT NULL,
        "title" text NOT NULL,
        "mode" text NOT NULL,
        "generation_data" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pitch_decks" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_pitch_decks_mode" CHECK (mode IN ('free', 'custom'))
      )
    `);

    // Create index for pitch_decks
    await queryRunner.query(`CREATE INDEX "idx_pitch_decks_project" ON "pitch_decks" ("project_id")`);

    // Create slides table
    await queryRunner.query(`
      CREATE TABLE "slides" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "deck_id" uuid NOT NULL,
        "title" text NOT NULL,
        "content" text NOT NULL,
        "speaker_notes" text,
        "slide_type" text NOT NULL,
        "slide_order" integer NOT NULL,
        "generated_by" character varying(20) NOT NULL DEFAULT 'openai',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_slides" PRIMARY KEY ("id")
      )
    `);

    // Create index for slides
    await queryRunner.query(`CREATE INDEX "idx_slides_deck" ON "slides" ("deck_id", "slide_order")`);

    // Create slide_templates table
    await queryRunner.query(`
      CREATE TABLE "slide_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "category" character varying(50) NOT NULL,
        "description" text,
        "template_data" jsonb NOT NULL,
        "preview_image_url" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_slide_templates" PRIMARY KEY ("id")
      )
    `);

    // Create index for slide_templates
    await queryRunner.query(`CREATE INDEX "idx_templates_category" ON "slide_templates" ("category", "is_active")`);

    // Create media_files table
    await queryRunner.query(`
      CREATE TABLE "media_files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" character varying(255) NOT NULL,
        "filename" character varying(255) NOT NULL,
        "original_filename" character varying(255) NOT NULL,
        "file_type" character varying(50) NOT NULL,
        "mime_type" character varying(100) NOT NULL,
        "file_size" integer NOT NULL,
        "file_url" text NOT NULL,
        "thumbnail_url" text,
        "storage_key" character varying(500) NOT NULL,
        "project_id" uuid,
        "slide_id" uuid,
        "description" text,
        "tags" jsonb,
        "is_ai_suggested" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_media_files" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for media_files
    await queryRunner.query(`CREATE INDEX "idx_media_files_user" ON "media_files" ("user_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "idx_media_files_type" ON "media_files" ("file_type", "is_ai_suggested")`);

    // Create user_ai_settings table
    await queryRunner.query(`
      CREATE TABLE "user_ai_settings" (
        "user_id" character varying(255) NOT NULL,
        "openai_api_key" text,
        "learning_enabled" boolean NOT NULL DEFAULT true,
        "learning_scope" character varying(20) NOT NULL DEFAULT 'deck',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_ai_settings" PRIMARY KEY ("user_id"),
        CONSTRAINT "CHK_user_ai_settings_learning_scope" CHECK (learning_scope IN ('deck', 'project', 'global', 'off'))
      )
    `);

    // Create deck_versions table
    await queryRunner.query(`
      CREATE TABLE "deck_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "deck_id" uuid NOT NULL,
        "version_number" integer NOT NULL,
        "description" text,
        "change_summary" text,
        "version_data" jsonb NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_deck_versions" PRIMARY KEY ("id")
      )
    `);

    // Create index for deck_versions
    await queryRunner.query(`CREATE INDEX "idx_deck_versions_deck" ON "deck_versions" ("deck_id", "version_number")`);

    // Create chatbot_conversations table
    await queryRunner.query(`
      CREATE TABLE "chatbot_conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" character varying(255) NOT NULL,
        "deck_id" uuid NOT NULL,
        "slide_id" uuid,
        "conversation_data" jsonb NOT NULL,
        "context_used" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chatbot_conversations" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for chatbot_conversations
    await queryRunner.query(`CREATE INDEX "idx_chatbot_conversations_user" ON "chatbot_conversations" ("user_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "idx_chatbot_conversations_deck" ON "chatbot_conversations" ("deck_id", "created_at")`);

    // Create project_context_memory table
    await queryRunner.query(`
      CREATE TABLE "project_context_memory" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "project_id" uuid NOT NULL,
        "deck_id" uuid NOT NULL,
        "event_type" character varying(50) NOT NULL,
        "content" jsonb NOT NULL,
        "learning_scope" character varying(20) NOT NULL DEFAULT 'deck',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_context_memory" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_project_context_memory_event_type" CHECK (event_type IN ('user_input', 'ai_generation', 'user_edit', 'feedback', 'chatbot_interaction')),
        CONSTRAINT "CHK_project_context_memory_learning_scope" CHECK (learning_scope IN ('deck', 'project', 'global'))
      )
    `);

    // Create indexes for project_context_memory
    await queryRunner.query(`CREATE INDEX "idx_context_memory_project" ON "project_context_memory" ("project_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "idx_context_memory_deck" ON "project_context_memory" ("deck_id", "created_at")`);

    // Create user_learning_patterns table
    await queryRunner.query(`
      CREATE TABLE "user_learning_patterns" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" character varying(255) NOT NULL,
        "scope_type" character varying(20) NOT NULL,
        "scope_id" uuid,
        "pattern_type" character varying(50) NOT NULL,
        "pattern_data" jsonb NOT NULL,
        "confidence_score" decimal(3,2) NOT NULL DEFAULT 0.50,
        "last_reinforced" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_learning_patterns" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_user_learning_patterns_scope_type" CHECK (scope_type IN ('deck', 'project', 'global')),
        CONSTRAINT "CHK_user_learning_patterns_pattern_type" CHECK (pattern_type IN ('content_preference', 'style_preference', 'correction_pattern')),
        CONSTRAINT "CHK_user_learning_patterns_confidence_score" CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00)
      )
    `);

    // Create indexes for user_learning_patterns
    await queryRunner.query(`CREATE INDEX "idx_learning_patterns_user_scope" ON "user_learning_patterns" ("user_id", "scope_type", "scope_id")`);
    await queryRunner.query(`CREATE INDEX "idx_learning_patterns_confidence" ON "user_learning_patterns" ("confidence_score")`);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "pitch_decks" 
      ADD CONSTRAINT "FK_pitch_decks_project" 
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "slides" 
      ADD CONSTRAINT "FK_slides_deck" 
      FOREIGN KEY ("deck_id") REFERENCES "pitch_decks"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "deck_versions" 
      ADD CONSTRAINT "FK_deck_versions_deck" 
      FOREIGN KEY ("deck_id") REFERENCES "pitch_decks"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "chatbot_conversations" 
      ADD CONSTRAINT "FK_chatbot_conversations_deck" 
      FOREIGN KEY ("deck_id") REFERENCES "pitch_decks"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "chatbot_conversations" 
      ADD CONSTRAINT "FK_chatbot_conversations_slide" 
      FOREIGN KEY ("slide_id") REFERENCES "slides"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "project_context_memory" 
      ADD CONSTRAINT "FK_project_context_memory_project" 
      FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "project_context_memory" 
      ADD CONSTRAINT "FK_project_context_memory_deck" 
      FOREIGN KEY ("deck_id") REFERENCES "pitch_decks"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_learning_patterns" 
      ADD CONSTRAINT "FK_user_learning_patterns_project" 
      FOREIGN KEY ("scope_id") REFERENCES "projects"("id") ON DELETE CASCADE
    `);

    console.log('✅ Initial schema migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints first
    await queryRunner.query(`ALTER TABLE "user_learning_patterns" DROP CONSTRAINT "FK_user_learning_patterns_project"`);
    await queryRunner.query(`ALTER TABLE "project_context_memory" DROP CONSTRAINT "FK_project_context_memory_deck"`);
    await queryRunner.query(`ALTER TABLE "project_context_memory" DROP CONSTRAINT "FK_project_context_memory_project"`);
    await queryRunner.query(`ALTER TABLE "chatbot_conversations" DROP CONSTRAINT "FK_chatbot_conversations_slide"`);
    await queryRunner.query(`ALTER TABLE "chatbot_conversations" DROP CONSTRAINT "FK_chatbot_conversations_deck"`);
    await queryRunner.query(`ALTER TABLE "deck_versions" DROP CONSTRAINT "FK_deck_versions_deck"`);
    await queryRunner.query(`ALTER TABLE "slides" DROP CONSTRAINT "FK_slides_deck"`);
    await queryRunner.query(`ALTER TABLE "pitch_decks" DROP CONSTRAINT "FK_pitch_decks_project"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX "idx_learning_patterns_confidence"`);
    await queryRunner.query(`DROP INDEX "idx_learning_patterns_user_scope"`);
    await queryRunner.query(`DROP INDEX "idx_context_memory_deck"`);
    await queryRunner.query(`DROP INDEX "idx_context_memory_project"`);
    await queryRunner.query(`DROP INDEX "idx_chatbot_conversations_deck"`);
    await queryRunner.query(`DROP INDEX "idx_chatbot_conversations_user"`);
    await queryRunner.query(`DROP INDEX "idx_deck_versions_deck"`);
    await queryRunner.query(`DROP INDEX "idx_media_files_type"`);
    await queryRunner.query(`DROP INDEX "idx_media_files_user"`);
    await queryRunner.query(`DROP INDEX "idx_templates_category"`);
    await queryRunner.query(`DROP INDEX "idx_slides_deck"`);
    await queryRunner.query(`DROP INDEX "idx_pitch_decks_project"`);
    await queryRunner.query(`DROP INDEX "idx_projects_user_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "user_learning_patterns"`);
    await queryRunner.query(`DROP TABLE "project_context_memory"`);
    await queryRunner.query(`DROP TABLE "chatbot_conversations"`);
    await queryRunner.query(`DROP TABLE "deck_versions"`);
    await queryRunner.query(`DROP TABLE "user_ai_settings"`);
    await queryRunner.query(`DROP TABLE "media_files"`);
    await queryRunner.query(`DROP TABLE "slide_templates"`);
    await queryRunner.query(`DROP TABLE "slides"`);
    await queryRunner.query(`DROP TABLE "pitch_decks"`);
    await queryRunner.query(`DROP TABLE "projects"`);

    console.log('✅ Initial schema migration rolled back successfully');
  }
}