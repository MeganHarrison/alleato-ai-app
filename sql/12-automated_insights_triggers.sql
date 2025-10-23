-- Automated Insights Processing Triggers
-- Creates database triggers and queues for automatic insights generation

-- Create a processing queue table for async insights generation
CREATE TABLE IF NOT EXISTS insights_processing_queue (
    id BIGSERIAL PRIMARY KEY,
    document_id TEXT NOT NULL,
    document_title TEXT,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

-- Create indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_insights_queue_status ON insights_processing_queue (processing_status);
CREATE INDEX IF NOT EXISTS idx_insights_queue_created ON insights_processing_queue (created_at);
CREATE INDEX IF NOT EXISTS idx_insights_queue_document ON insights_processing_queue (document_id);

-- Create projects table if it doesn't exist (for project matching)
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    aliases TEXT[], -- Alternative names for the project
    keywords TEXT[], -- Keywords associated with the project
    client_name TEXT,
    project_type TEXT DEFAULT 'construction', -- construction, maintenance, etc.
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    start_date DATE,
    end_date DATE,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for projects table
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects (name);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_aliases_gin ON projects USING GIN (aliases);
CREATE INDEX IF NOT EXISTS idx_projects_keywords_gin ON projects USING GIN (keywords);

-- Enhance project_insights table with better project linking
ALTER TABLE project_insights 
ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES projects(id),
ADD COLUMN IF NOT EXISTS processing_metadata JSONB DEFAULT '{}';

-- Create index for project linking
CREATE INDEX IF NOT EXISTS idx_project_insights_project_id ON project_insights (project_id);

-- Function to queue document for insights processing
CREATE OR REPLACE FUNCTION queue_document_for_insights(
    doc_id TEXT,
    doc_title TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    already_queued BOOLEAN;
    already_processed BOOLEAN;
BEGIN
    -- Check if already in queue
    SELECT EXISTS (
        SELECT 1 FROM insights_processing_queue 
        WHERE document_id = doc_id AND processing_status IN ('pending', 'processing')
    ) INTO already_queued;
    
    IF already_queued THEN
        RETURN FALSE; -- Already queued
    END IF;
    
    -- Check if already has insights
    SELECT EXISTS (
        SELECT 1 FROM project_insights 
        WHERE source_document_id = doc_id
    ) INTO already_processed;
    
    IF already_processed THEN
        RETURN FALSE; -- Already processed
    END IF;
    
    -- Queue for processing
    INSERT INTO insights_processing_queue (document_id, document_title, metadata)
    VALUES (doc_id, doc_title, jsonb_build_object('queued_at', NOW()));
    
    RETURN TRUE;
END;
$$;

-- Function to check if document is a meeting transcript
CREATE OR REPLACE FUNCTION is_meeting_transcript(
    doc_title TEXT,
    doc_content TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    title_indicators TEXT[] := ARRAY['meeting', 'call', 'session', 'standup', 'sync', 'review', 'discussion', 'conference', 'huddle', 'briefing', 'kickoff'];
    speaker_pattern_count INTEGER;
    total_lines INTEGER;
    speaker_ratio FLOAT;
BEGIN
    -- Check title for meeting indicators
    IF EXISTS (
        SELECT 1 FROM unnest(title_indicators) AS indicator 
        WHERE LOWER(doc_title) LIKE '%' || indicator || '%'
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check content for conversation patterns (simplified version)
    -- Count lines that look like speaker patterns
    SELECT 
        (SELECT COUNT(*) FROM regexp_split_to_table(doc_content, E'\\n') AS line 
         WHERE line ~ '^[A-Z][a-zA-Z\\s]+:\\s|^\\[?[A-Z_]+\\d*\\]?:\\s|^\\[[^\\]]+\\]\\s*[A-Z]'
        ) INTO speaker_pattern_count;
    
    -- Count total non-empty lines
    SELECT COUNT(*) FROM regexp_split_to_table(doc_content, E'\\n') AS line 
    WHERE TRIM(line) != '' INTO total_lines;
    
    -- Calculate speaker ratio
    IF total_lines > 0 THEN
        speaker_ratio := speaker_pattern_count::FLOAT / total_lines::FLOAT;
        RETURN speaker_ratio > 0.15; -- If more than 15% of lines have speaker patterns
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Trigger function for new document processing
CREATE OR REPLACE FUNCTION trigger_document_insights_processing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    doc_title TEXT;
    doc_content TEXT;
    is_transcript BOOLEAN;
BEGIN
    -- Extract title and content
    doc_title := COALESCE(NEW.metadata->>'file_title', 'Unknown Document');
    doc_content := COALESCE(NEW.content, '');
    
    -- Check if this looks like a meeting transcript
    SELECT is_meeting_transcript(doc_title, LEFT(doc_content, 2000)) INTO is_transcript;
    
    -- Only queue meeting transcripts for insights processing
    IF is_transcript THEN
        -- Queue the document for insights processing
        PERFORM queue_document_for_insights(NEW.id::TEXT, doc_title);
        
        -- Log the queuing
        RAISE NOTICE 'Queued document % (%) for insights processing', NEW.id, doc_title;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on documents table for new inserts
DROP TRIGGER IF EXISTS trigger_new_document_insights ON documents;
CREATE TRIGGER trigger_new_document_insights
    AFTER INSERT ON documents
    FOR EACH ROW
    EXECUTE FUNCTION trigger_document_insights_processing();

-- Function to get next document from processing queue
CREATE OR REPLACE FUNCTION get_next_document_for_processing()
RETURNS TABLE (
    queue_id BIGINT,
    document_id TEXT,
    document_title TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Get the oldest pending document and mark it as processing
    RETURN QUERY
    WITH next_doc AS (
        SELECT ipq.id, ipq.document_id, ipq.document_title, ipq.created_at
        FROM insights_processing_queue ipq
        WHERE ipq.processing_status = 'pending'
          AND ipq.retry_count < 3  -- Don't retry more than 3 times
        ORDER BY ipq.created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED  -- Prevent race conditions
    )
    UPDATE insights_processing_queue 
    SET 
        processing_status = 'processing',
        started_at = NOW(),
        retry_count = retry_count + 1
    FROM next_doc
    WHERE insights_processing_queue.id = next_doc.id
    RETURNING next_doc.id, next_doc.document_id, next_doc.document_title, next_doc.created_at;
END;
$$;

-- Function to mark document processing as completed
CREATE OR REPLACE FUNCTION complete_document_processing(
    queue_id_param BIGINT,
    success BOOLEAN,
    error_msg TEXT DEFAULT NULL,
    insights_count INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF success THEN
        UPDATE insights_processing_queue
        SET 
            processing_status = 'completed',
            completed_at = NOW(),
            error_message = NULL,
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                'completed_at', NOW(),
                'insights_generated', insights_count
            )
        WHERE id = queue_id_param;
    ELSE
        UPDATE insights_processing_queue
        SET 
            processing_status = CASE 
                WHEN retry_count >= 3 THEN 'failed'
                ELSE 'pending'  -- Allow retry
            END,
            error_message = error_msg,
            metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
                'last_error_at', NOW(),
                'error_message', error_msg
            )
        WHERE id = queue_id_param;
    END IF;
END;
$$;

-- Function to get processing queue statistics
CREATE OR REPLACE FUNCTION get_insights_queue_stats()
RETURNS TABLE (
    pending_count BIGINT,
    processing_count BIGINT,
    completed_count BIGINT,
    failed_count BIGINT,
    total_count BIGINT,
    oldest_pending_age INTERVAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE processing_status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE processing_status = 'processing') as processing_count,
        COUNT(*) FILTER (WHERE processing_status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE processing_status = 'failed') as failed_count,
        COUNT(*) as total_count,
        CASE 
            WHEN COUNT(*) FILTER (WHERE processing_status = 'pending') > 0 THEN
                NOW() - MIN(created_at) FILTER (WHERE processing_status = 'pending')
            ELSE INTERVAL '0'
        END as oldest_pending_age
    FROM insights_processing_queue;
END;
$$;

-- Function to reset failed processing attempts (for manual retry)
CREATE OR REPLACE FUNCTION reset_failed_processing()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    UPDATE insights_processing_queue
    SET 
        processing_status = 'pending',
        retry_count = 0,
        error_message = NULL,
        started_at = NULL
    WHERE processing_status = 'failed';
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    RETURN reset_count;
END;
$$;

-- Function to clean up old completed queue items
CREATE OR REPLACE FUNCTION cleanup_completed_queue_items(
    older_than_days INTEGER DEFAULT 7
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM insights_processing_queue
    WHERE processing_status = 'completed'
      AND completed_at < NOW() - INTERVAL '1 day' * older_than_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Function to find documents that need retroactive processing
CREATE OR REPLACE FUNCTION queue_unprocessed_documents()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    queued_count INTEGER := 0;
    doc_record RECORD;
BEGIN
    -- Find documents that don't have insights and aren't queued
    FOR doc_record IN
        SELECT d.id, d.metadata->>'file_title' as title, LEFT(d.content, 2000) as content_sample
        FROM documents d
        WHERE NOT EXISTS (
            SELECT 1 FROM project_insights pi 
            WHERE pi.source_document_id = d.id::TEXT
        )
        AND NOT EXISTS (
            SELECT 1 FROM insights_processing_queue ipq 
            WHERE ipq.document_id = d.id::TEXT 
            AND ipq.processing_status IN ('pending', 'processing', 'completed')
        )
    LOOP
        -- Check if it's a meeting transcript
        IF is_meeting_transcript(doc_record.title, doc_record.content_sample) THEN
            -- Queue it
            PERFORM queue_document_for_insights(doc_record.id::TEXT, doc_record.title);
            queued_count := queued_count + 1;
        END IF;
    END LOOP;
    
    RETURN queued_count;
END;
$$;

-- Create a view for easy monitoring of the processing pipeline
CREATE OR REPLACE VIEW insights_processing_monitor AS
SELECT 
    ipq.id,
    ipq.document_id,
    ipq.document_title,
    ipq.processing_status,
    ipq.retry_count,
    ipq.error_message,
    ipq.created_at,
    ipq.started_at,
    ipq.completed_at,
    CASE 
        WHEN ipq.processing_status = 'pending' THEN NOW() - ipq.created_at
        WHEN ipq.processing_status = 'processing' THEN NOW() - ipq.started_at
        ELSE NULL
    END as processing_time,
    
    -- Count existing insights for this document
    (SELECT COUNT(*) FROM project_insights pi WHERE pi.source_document_id = ipq.document_id) as existing_insights_count,
    
    -- Document metadata
    d.metadata as document_metadata
    
FROM insights_processing_queue ipq
LEFT JOIN documents d ON d.id::TEXT = ipq.document_id
ORDER BY ipq.created_at DESC;

-- Initial setup: Queue any unprocessed documents
SELECT queue_unprocessed_documents() as initial_queued_documents;

-- Create helpful comments
COMMENT ON TABLE insights_processing_queue IS 'Queue for processing documents to extract project insights';
COMMENT ON TABLE projects IS 'Project definitions for linking insights to specific projects';
COMMENT ON FUNCTION queue_document_for_insights IS 'Queue a document for automated insights processing';
COMMENT ON FUNCTION get_next_document_for_processing IS 'Get the next document from the processing queue (atomic)';
COMMENT ON FUNCTION complete_document_processing IS 'Mark a document processing job as completed or failed';
COMMENT ON VIEW insights_processing_monitor IS 'Monitor view for insights processing pipeline status';