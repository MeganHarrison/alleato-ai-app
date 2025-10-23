-- ==============================================================================
-- REFACTOR: Document Tables Architecture
-- ==============================================================================
-- This migration refactors the document storage architecture:
-- 1. document_metadata - Stores full meeting transcripts and metadata (main storage)
-- 2. documents - Stores only chunks with embeddings for vector search
-- 3. document_chunks - Alternative chunk storage (if needed)
-- ==============================================================================

-- Step 1: Enhance document_metadata table to store full transcripts
-- ==============================================================================
ALTER TABLE document_metadata
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'fireflies',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'meeting',
ADD COLUMN IF NOT EXISTS content TEXT,  -- Full transcript content
ADD COLUMN IF NOT EXISTS participants TEXT[],
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS action_items TEXT[],
ADD COLUMN IF NOT EXISTS bullet_points TEXT[],
ADD COLUMN IF NOT EXISTS fireflies_id TEXT UNIQUE,  -- Unique constraint for Fireflies ID
ADD COLUMN IF NOT EXISTS fireflies_link TEXT,
ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id);

-- Create indexes for document_metadata
CREATE INDEX IF NOT EXISTS idx_document_metadata_fireflies_id ON document_metadata(fireflies_id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_date ON document_metadata(date DESC);
CREATE INDEX IF NOT EXISTS idx_document_metadata_source ON document_metadata(source);
CREATE INDEX IF NOT EXISTS idx_document_metadata_category ON document_metadata(category);
CREATE INDEX IF NOT EXISTS idx_document_metadata_project_id ON document_metadata(project_id);

-- Create GIN indexes for arrays
CREATE INDEX IF NOT EXISTS idx_document_metadata_participants ON document_metadata USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_document_metadata_action_items ON document_metadata USING GIN (action_items);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_document_metadata_fts ON document_metadata USING GIN (
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || COALESCE(summary, ''))
);

-- Step 2: Clean up documents table to be chunks-only
-- ==============================================================================
-- The documents table should only store chunks with embeddings
-- Each chunk references its parent document in document_metadata

-- Add reference to parent document if not exists
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS document_metadata_id TEXT REFERENCES document_metadata(id) ON DELETE CASCADE;

-- Ensure we have the chunk-specific fields
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS chunk_index INTEGER,
ADD COLUMN IF NOT EXISTS chunk_text TEXT,
ADD COLUMN IF NOT EXISTS speaker TEXT,
ADD COLUMN IF NOT EXISTS start_time NUMERIC,
ADD COLUMN IF NOT EXISTS end_time NUMERIC;

-- Create indexes for chunk searching
CREATE INDEX IF NOT EXISTS idx_documents_metadata_id ON documents(document_metadata_id);
CREATE INDEX IF NOT EXISTS idx_documents_chunk_index ON documents(chunk_index);
CREATE INDEX IF NOT EXISTS idx_documents_speaker ON documents(speaker);

-- Step 3: Create document_chunks table (alternative/backup chunk storage)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS document_chunks (
    id SERIAL PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES document_metadata(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    speaker TEXT,
    start_time NUMERIC,
    end_time NUMERIC,
    embedding vector(1536),  -- For OpenAI embeddings
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),

    -- Ensure unique chunk index per document
    UNIQUE(document_id, chunk_index)
);

-- Create indexes for document_chunks
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_speaker ON document_chunks(speaker);

-- Create vector similarity search index
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Step 4: Update function to work with new structure
-- ==============================================================================
CREATE OR REPLACE FUNCTION search_documents_semantic(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    filter_params jsonb DEFAULT '{}'
)
RETURNS TABLE (
    chunk_id bigint,
    document_id text,
    chunk_content text,
    chunk_metadata jsonb,
    similarity float,
    document_title text,
    document_date timestamp with time zone,
    document_summary text,
    document_participants text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id as chunk_id,
        dm.id as document_id,
        d.content as chunk_content,
        d.metadata as chunk_metadata,
        1 - (d.embedding <=> query_embedding) as similarity,
        dm.title as document_title,
        dm.date as document_date,
        dm.summary as document_summary,
        dm.participants as document_participants
    FROM documents d
    JOIN document_metadata dm ON d.document_metadata_id = dm.id
    WHERE
        1 - (d.embedding <=> query_embedding) > match_threshold
        AND (
            filter_params->>'source' IS NULL OR
            dm.source = filter_params->>'source'
        )
        AND (
            filter_params->>'category' IS NULL OR
            dm.category = filter_params->>'category'
        )
        AND (
            filter_params->>'project_id' IS NULL OR
            dm.project_id = (filter_params->>'project_id')::integer
        )
        AND (
            filter_params->>'date_from' IS NULL OR
            dm.date >= (filter_params->>'date_from')::timestamp
        )
        AND (
            filter_params->>'date_to' IS NULL OR
            dm.date <= (filter_params->>'date_to')::timestamp
        )
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Step 5: Create view for easy access to complete document information
-- ==============================================================================
CREATE OR REPLACE VIEW document_overview AS
SELECT
    dm.id,
    dm.title,
    dm.source,
    dm.category,
    dm.date,
    dm.participants,
    dm.summary,
    dm.action_items,
    dm.bullet_points,
    dm.fireflies_id,
    dm.fireflies_link,
    dm.project_id,
    p.name as project_name,
    dm.created_at,
    dm.updated_at,
    COUNT(DISTINCT dc.id) as chunk_count,
    COUNT(DISTINCT di.id) as insight_count
FROM document_metadata dm
LEFT JOIN projects p ON dm.project_id = p.id
LEFT JOIN documents dc ON dc.document_metadata_id = dm.id
LEFT JOIN document_insights di ON di.document_id = dm.id
GROUP BY
    dm.id, dm.title, dm.source, dm.category, dm.date,
    dm.participants, dm.summary, dm.action_items, dm.bullet_points,
    dm.fireflies_id, dm.fireflies_link, dm.project_id, p.name,
    dm.created_at, dm.updated_at;

-- Step 6: Migrate existing data (if needed)
-- ==============================================================================
-- This section migrates data from old structure to new structure
-- Uncomment and run if you have existing data in the documents table

/*
-- Migrate full documents to document_metadata
INSERT INTO document_metadata (
    id,
    title,
    source,
    category,
    content,
    participants,
    summary,
    action_items,
    bullet_points,
    fireflies_id,
    fireflies_link,
    date,
    metadata,
    created_at,
    updated_at
)
SELECT
    COALESCE(fireflies_id, gen_random_uuid()::text) as id,
    title,
    source,
    category,
    content,
    participants,
    summary,
    action_items,
    bullet_points,
    fireflies_id,
    fireflies_link,
    date,
    metadata,
    created_at,
    updated_at
FROM documents
WHERE
    source = 'fireflies'
    AND fireflies_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM document_metadata dm
        WHERE dm.fireflies_id = documents.fireflies_id
    );

-- Clean up documents table to keep only chunks
-- First, update chunks to reference their parent documents
UPDATE documents d
SET document_metadata_id = dm.id
FROM document_metadata dm
WHERE d.fireflies_id = dm.fireflies_id
AND d.fireflies_id IS NOT NULL;

-- Remove full documents (keep only chunks)
DELETE FROM documents
WHERE
    chunk_index IS NULL
    AND embedding IS NULL
    AND fireflies_id IS NOT NULL;

-- Drop columns from documents table that are now in document_metadata
ALTER TABLE documents
DROP COLUMN IF EXISTS title,
DROP COLUMN IF EXISTS source,
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS participants,
DROP COLUMN IF EXISTS summary,
DROP COLUMN IF EXISTS action_items,
DROP COLUMN IF EXISTS bullet_points,
DROP COLUMN IF EXISTS fireflies_id,
DROP COLUMN IF EXISTS fireflies_link,
DROP COLUMN IF EXISTS date;
*/

-- Step 7: Update triggers for timestamp management
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_document_metadata_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_metadata_updated_at
    BEFORE UPDATE ON document_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_document_metadata_timestamp();

-- Step 8: Add comments for documentation
-- ==============================================================================
COMMENT ON TABLE document_metadata IS 'Main storage for full meeting transcripts and document metadata';
COMMENT ON TABLE documents IS 'Stores document chunks with vector embeddings for semantic search';
COMMENT ON TABLE document_chunks IS 'Alternative chunk storage with detailed speaker and timing information';

COMMENT ON COLUMN document_metadata.fireflies_id IS 'Unique identifier from Fireflies.ai';
COMMENT ON COLUMN document_metadata.content IS 'Full transcript or document content';
COMMENT ON COLUMN document_metadata.participants IS 'Array of meeting participants';
COMMENT ON COLUMN document_metadata.action_items IS 'Array of action items extracted from the meeting';
COMMENT ON COLUMN document_metadata.bullet_points IS 'Key points from the meeting';

COMMENT ON COLUMN documents.document_metadata_id IS 'Reference to parent document in document_metadata table';
COMMENT ON COLUMN documents.embedding IS 'Vector embedding for semantic search';
COMMENT ON COLUMN documents.chunk_index IS 'Sequential index of this chunk within the document';

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- The new architecture is:
-- 1. document_metadata: Full transcripts and metadata (source of truth)
-- 2. documents: Chunks with embeddings (for vector search)
-- 3. document_chunks: Alternative chunk storage (optional)
-- 4. document_insights: AI-generated insights linked to document_metadata
-- ==============================================================================