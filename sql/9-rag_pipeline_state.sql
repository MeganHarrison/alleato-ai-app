-- RAG Pipeline State Management Table
-- This table stores runtime state for pipeline instances to support both continuous and scheduled execution

CREATE TABLE IF NOT EXISTS rag_pipeline_state (
    pipeline_id TEXT PRIMARY KEY,     -- User-defined pipeline ID (from RAG_PIPELINE_ID env var)
    pipeline_type TEXT NOT NULL,      -- 'google_drive' or 'local_files'
    last_check_time TIMESTAMP,        -- Last successful check for changes
    known_files JSONB,                -- File metadata for change detection (file_id -> timestamp mapping)
    last_run TIMESTAMP,               -- Last successful run timestamp
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rag_pipeline_state_pipeline_type ON rag_pipeline_state(pipeline_type);
CREATE INDEX IF NOT EXISTS idx_rag_pipeline_state_last_run ON rag_pipeline_state(last_run);

-- Enable Row Level Security
ALTER TABLE rag_pipeline_state ENABLE ROW LEVEL SECURITY;

-- Example trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rag_pipeline_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_rag_pipeline_state_updated_at
    BEFORE UPDATE ON rag_pipeline_state
    FOR EACH ROW
    EXECUTE FUNCTION update_rag_pipeline_state_updated_at();