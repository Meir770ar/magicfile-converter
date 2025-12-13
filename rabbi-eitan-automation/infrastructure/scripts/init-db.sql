-- Rabbi Eitan - Database Initialization
-- PostgreSQL 15

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================
-- Content Table
-- ================================
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_url TEXT NOT NULL,
    source_type VARCHAR(20) NOT NULL DEFAULT 'html', -- 'html' or 'rss'
    raw_text TEXT NOT NULL,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_for DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for date lookups
CREATE INDEX IF NOT EXISTS idx_content_date ON content(date_for);
CREATE INDEX IF NOT EXISTS idx_content_scraped_at ON content(scraped_at);

-- ================================
-- Scripts Table
-- ================================
CREATE TABLE IF NOT EXISTS scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    script_text TEXT NOT NULL,
    prompt_used TEXT,
    ai_model VARCHAR(50) DEFAULT 'gemini-2.0-flash',
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'editing'
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for status and content lookups
CREATE INDEX IF NOT EXISTS idx_scripts_status ON scripts(status);
CREATE INDEX IF NOT EXISTS idx_scripts_content ON scripts(content_id);

-- ================================
-- Media Table
-- ================================
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL, -- 'audio', 'video', 'final'
    provider VARCHAR(50) NOT NULL, -- 'elevenlabs', 'heygen', 'ffmpeg'
    file_path TEXT,
    file_url TEXT,
    file_size_bytes BIGINT,
    duration_seconds FLOAT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for script and status lookups
CREATE INDEX IF NOT EXISTS idx_media_script ON media(script_id);
CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);

-- ================================
-- Distribution Table
-- ================================
CREATE TABLE IF NOT EXISTS distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'telegram', 'whatsapp', 'youtube', etc.
    platform_message_id TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for media and platform lookups
CREATE INDEX IF NOT EXISTS idx_distributions_media ON distributions(media_id);
CREATE INDEX IF NOT EXISTS idx_distributions_platform ON distributions(platform);

-- ================================
-- Pipeline Status Table
-- ================================
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content(id),
    current_step INT NOT NULL DEFAULT 1, -- 1 to 6
    status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'paused', 'completed', 'failed'
    steps_completed JSONB DEFAULT '[]',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Index for status lookups
CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_started ON pipeline_runs(started_at);

-- ================================
-- API Credits Tracking
-- ================================
CREATE TABLE IF NOT EXISTS api_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL, -- 'elevenlabs', 'heygen', 'gemini', 'openai'
    credits_used INT NOT NULL DEFAULT 0,
    credits_remaining INT,
    operation_type VARCHAR(50),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Index for provider lookups
CREATE INDEX IF NOT EXISTS idx_credits_provider ON api_credits(provider);
CREATE INDEX IF NOT EXISTS idx_credits_recorded ON api_credits(recorded_at);

-- ================================
-- Voice Notes Table (for Telegram approval)
-- ================================
CREATE TABLE IF NOT EXISTS voice_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    telegram_file_id TEXT NOT NULL,
    file_path TEXT,
    transcription TEXT,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for script lookups
CREATE INDEX IF NOT EXISTS idx_voice_notes_script ON voice_notes(script_id);

-- ================================
-- Updated At Trigger Function
-- ================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON scripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- Initial Data (Optional)
-- ================================
-- Insert a test record to verify setup
INSERT INTO api_credits (provider, credits_used, credits_remaining, operation_type)
VALUES ('system', 0, 0, 'initialization')
ON CONFLICT DO NOTHING;

-- Grant permissions (if using separate app user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rabbi_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rabbi_user;
