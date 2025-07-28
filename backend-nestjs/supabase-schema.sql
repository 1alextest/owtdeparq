-- AI Pitch Deck Generator - Database Schema for Supabase
-- Run this script in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    target_audience TEXT,
    business_model VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pitch_decks table
CREATE TABLE IF NOT EXISTS pitch_decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    theme VARCHAR(100) DEFAULT 'professional',
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create slide_templates table
CREATE TABLE IF NOT EXISTS slide_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    content_structure JSONB,
    design_elements JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create slides table
CREATE TABLE IF NOT EXISTS slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_id UUID NOT NULL REFERENCES pitch_decks(id) ON DELETE CASCADE,
    template_id UUID REFERENCES slide_templates(id),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    content JSONB,
    design_settings JSONB,
    notes TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deck_versions table
CREATE TABLE IF NOT EXISTS deck_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_id UUID NOT NULL REFERENCES pitch_decks(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title VARCHAR(255),
    description TEXT,
    snapshot_data JSONB,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create media_files table
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    storage_key VARCHAR(500) NOT NULL,
    project_id UUID REFERENCES projects(id),
    slide_id UUID REFERENCES slides(id),
    description TEXT,
    tags JSONB,
    is_ai_suggested BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create context_memory_events table
CREATE TABLE IF NOT EXISTS context_memory_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES projects(id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    context_tags TEXT[],
    importance_score DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning_patterns table
CREATE TABLE IF NOT EXISTS learning_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(100) NOT NULL,
    pattern_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_contexts table
CREATE TABLE IF NOT EXISTS chat_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES projects(id),
    session_id VARCHAR(255) NOT NULL,
    context_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_ai_settings table
CREATE TABLE IF NOT EXISTS user_ai_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    preferred_ai_provider VARCHAR(50) DEFAULT 'openai',
    creativity_level DECIMAL(2,1) DEFAULT 0.7,
    content_style VARCHAR(50) DEFAULT 'professional',
    language_preference VARCHAR(10) DEFAULT 'en',
    custom_instructions TEXT,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_pitch_decks_project_id ON pitch_decks(project_id);
CREATE INDEX IF NOT EXISTS idx_slides_deck_id ON slides(deck_id);
CREATE INDEX IF NOT EXISTS idx_slides_type ON slides(type);
CREATE INDEX IF NOT EXISTS idx_deck_versions_deck_id ON deck_versions(deck_id);
CREATE INDEX IF NOT EXISTS idx_media_files_user ON media_files(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(file_type, is_ai_suggested);
CREATE INDEX IF NOT EXISTS idx_context_memory_user ON context_memory_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_user ON learning_patterns(user_id, pattern_type);
CREATE INDEX IF NOT EXISTS idx_chat_contexts_session ON chat_contexts(session_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pitch_decks_updated_at BEFORE UPDATE ON pitch_decks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_slides_updated_at BEFORE UPDATE ON slides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_patterns_updated_at BEFORE UPDATE ON learning_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_contexts_updated_at BEFORE UPDATE ON chat_contexts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_ai_settings_updated_at BEFORE UPDATE ON user_ai_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default slide templates
INSERT INTO slide_templates (name, type, category, description, content_structure, design_elements) VALUES
('Title Slide', 'title', 'opening', 'Main title slide for the presentation', 
 '{"title": "", "subtitle": "", "company": "", "presenter": ""}',
 '{"layout": "center", "background": "gradient", "font_size": "large"}'),
 
('Problem Statement', 'problem', 'core', 'Describe the problem you are solving',
 '{"title": "Problem", "problem_description": "", "pain_points": [], "market_evidence": ""}',
 '{"layout": "left_text_right_image", "background": "light", "emphasis": "problem"}'),
 
('Solution Overview', 'solution', 'core', 'Present your solution',
 '{"title": "Solution", "solution_description": "", "key_features": [], "benefits": []}',
 '{"layout": "center_focus", "background": "brand", "emphasis": "solution"}'),
 
('Market Opportunity', 'market', 'business', 'Show market size and opportunity',
 '{"title": "Market Opportunity", "market_size": "", "target_market": "", "growth_rate": ""}',
 '{"layout": "data_visualization", "background": "white", "charts": true}'),
 
('Business Model', 'business_model', 'business', 'Explain how you make money',
 '{"title": "Business Model", "revenue_streams": [], "pricing": "", "unit_economics": ""}',
 '{"layout": "structured_list", "background": "light", "icons": true}'),
 
('Financial Projections', 'financials', 'business', 'Show financial forecasts',
 '{"title": "Financial Projections", "revenue_forecast": "", "key_metrics": [], "funding_needs": ""}',
 '{"layout": "chart_heavy", "background": "white", "charts": true}'),
 
('Team', 'team', 'company', 'Introduce your team',
 '{"title": "Team", "team_members": [], "advisors": [], "key_hires": []}',
 '{"layout": "people_grid", "background": "light", "photos": true}'),
 
('Thank You', 'closing', 'closing', 'Closing slide with contact information',
 '{"title": "Thank You", "contact_info": "", "next_steps": "", "call_to_action": ""}',
 '{"layout": "center", "background": "brand", "font_size": "large"}');

-- Success message
SELECT 'Database schema created successfully! All tables, indexes, and default data have been set up.' as status;
