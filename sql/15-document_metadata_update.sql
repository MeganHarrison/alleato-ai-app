-- Ensure document_metadata table has content column for insights generation
-- This table must be populated with full document content

-- Add content column if it doesn't exist
ALTER TABLE document_metadata
ADD COLUMN IF NOT EXISTS content TEXT;

-- Add metadata column for additional information
ALTER TABLE document_metadata
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add updated_at timestamp
ALTER TABLE document_metadata
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_metadata_id ON document_metadata(id);
CREATE INDEX IF NOT EXISTS idx_document_metadata_title ON document_metadata(title);
CREATE INDEX IF NOT EXISTS idx_document_metadata_created_at ON document_metadata(created_at DESC);

-- Comment for documentation
COMMENT ON TABLE document_metadata IS 'Stores complete document metadata and full content for insights generation';
COMMENT ON COLUMN document_metadata.content IS 'Full document content - must be populated for insights generation';
COMMENT ON COLUMN document_metadata.metadata IS 'Additional metadata as JSONB';