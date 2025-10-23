-- Project Insights Schema for Meeting Analysis
-- Stores AI-generated insights extracted from meeting transcripts and project documents

-- Create enum types for insights
CREATE TYPE insight_type AS ENUM (
    'action_item',
    'decision',
    'risk',
    'milestone',
    'blocker',
    'dependency',
    'budget_update',
    'timeline_change',
    'stakeholder_feedback',
    'technical_issue',
    'opportunity',
    'concern'
);

CREATE TYPE insight_priority AS ENUM (
    'critical',
    'high',
    'medium',
    'low'
);

CREATE TYPE insight_status AS ENUM (
    'open',
    'in_progress',
    'completed',
    'cancelled'
);

-- Main project insights table
CREATE TABLE IF NOT EXISTS project_insights (
    id BIGSERIAL PRIMARY KEY,
    
    -- Core insight information
    insight_type insight_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    
    -- Classification
    priority insight_priority NOT NULL DEFAULT 'medium',
    status insight_status NOT NULL DEFAULT 'open',
    
    -- Project association
    project_name TEXT,
    assigned_to TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    
    -- Source information
    source_document_id TEXT,
    source_meeting_title TEXT,
    source_date TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    speakers TEXT[], -- Array of speaker names from the meeting
    keywords TEXT[], -- Keywords for searchability
    metadata JSONB,  -- Flexible metadata storage
    related_insights TEXT[], -- IDs of related insights
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_by TEXT DEFAULT 'ai_insights_generator'
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_project_insights_type ON project_insights (insight_type);
CREATE INDEX IF NOT EXISTS idx_project_insights_priority ON project_insights (priority);
CREATE INDEX IF NOT EXISTS idx_project_insights_status ON project_insights (status);
CREATE INDEX IF NOT EXISTS idx_project_insights_project_name ON project_insights (project_name);
CREATE INDEX IF NOT EXISTS idx_project_insights_source_document ON project_insights (source_document_id);
CREATE INDEX IF NOT EXISTS idx_project_insights_source_date ON project_insights (source_date DESC);
CREATE INDEX IF NOT EXISTS idx_project_insights_created_at ON project_insights (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_insights_assigned_to ON project_insights (assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_insights_due_date ON project_insights (due_date);

-- GIN indexes for array and JSONB fields
CREATE INDEX IF NOT EXISTS idx_project_insights_speakers_gin ON project_insights USING GIN (speakers);
CREATE INDEX IF NOT EXISTS idx_project_insights_keywords_gin ON project_insights USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_project_insights_metadata_gin ON project_insights USING GIN (metadata);

-- Full-text search index for title and description
CREATE INDEX IF NOT EXISTS idx_project_insights_fts ON project_insights USING GIN (
    to_tsvector('english', title || ' ' || description)
);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_insights_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_project_insights_updated_at
    BEFORE UPDATE ON project_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_project_insights_timestamp();

-- Function to get insights summary for a time period
CREATE OR REPLACE FUNCTION get_insights_summary(
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_insights BIGINT,
    insights_by_type JSONB,
    insights_by_priority JSONB,
    insights_by_status JSONB,
    active_projects JSONB,
    critical_items BIGINT,
    overdue_items BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    start_date TIMESTAMP WITH TIME ZONE;
BEGIN
    start_date := NOW() - INTERVAL '1 day' * days_back;
    
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_insights,
        
        -- Count by type
        jsonb_object_agg(
            insight_type::TEXT,
            type_count
        ) as insights_by_type,
        
        -- Count by priority
        jsonb_object_agg(
            priority::TEXT,
            priority_count
        ) as insights_by_priority,
        
        -- Count by status
        jsonb_object_agg(
            status::TEXT,
            status_count
        ) as insights_by_status,
        
        -- Active projects with counts
        jsonb_object_agg(
            COALESCE(project_name, 'Unassigned'),
            project_count
        ) as active_projects,
        
        -- Critical items count
        (SELECT COUNT(*) FROM project_insights 
         WHERE priority = 'critical' 
         AND status IN ('open', 'in_progress')
         AND created_at >= start_date)::BIGINT as critical_items,
        
        -- Overdue items count
        (SELECT COUNT(*) FROM project_insights 
         WHERE due_date < NOW() 
         AND status IN ('open', 'in_progress')
         AND created_at >= start_date)::BIGINT as overdue_items
         
    FROM (
        SELECT 
            insight_type,
            priority,
            status,
            project_name,
            COUNT(*) OVER (PARTITION BY insight_type) as type_count,
            COUNT(*) OVER (PARTITION BY priority) as priority_count,
            COUNT(*) OVER (PARTITION BY status) as status_count,
            COUNT(*) OVER (PARTITION BY COALESCE(project_name, 'Unassigned')) as project_count
        FROM project_insights
        WHERE created_at >= start_date
    ) summary_data
    GROUP BY (), (), (), (), (), ();
END;
$$;

-- Function to search insights with advanced filtering
CREATE OR REPLACE FUNCTION search_project_insights(
    search_query TEXT DEFAULT NULL,
    insight_types TEXT[] DEFAULT NULL,
    priorities TEXT[] DEFAULT NULL,
    status_filters TEXT[] DEFAULT NULL,
    project_name_filter TEXT DEFAULT NULL,
    assigned_to_filter TEXT DEFAULT NULL,
    date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    match_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id BIGINT,
    insight_type TEXT,
    title TEXT,
    description TEXT,
    confidence_score FLOAT,
    priority TEXT,
    status TEXT,
    project_name TEXT,
    assigned_to TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    source_meeting_title TEXT,
    source_date TIMESTAMP WITH TIME ZONE,
    speakers TEXT[],
    keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    search_rank FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.id,
        pi.insight_type::TEXT,
        pi.title,
        pi.description,
        pi.confidence_score,
        pi.priority::TEXT,
        pi.status::TEXT,
        pi.project_name,
        pi.assigned_to,
        pi.due_date,
        pi.source_meeting_title,
        pi.source_date,
        pi.speakers,
        pi.keywords,
        pi.created_at,
        CASE 
            WHEN search_query IS NOT NULL THEN 
                ts_rank_cd(
                    to_tsvector('english', pi.title || ' ' || pi.description),
                    to_tsquery('english', search_query)
                )
            ELSE 0.0
        END as search_rank
    FROM project_insights pi
    WHERE 
        -- Text search filter
        (search_query IS NULL OR 
         to_tsvector('english', pi.title || ' ' || pi.description) @@ to_tsquery('english', search_query))
        
        -- Type filter
        AND (insight_types IS NULL OR pi.insight_type::TEXT = ANY(insight_types))
        
        -- Priority filter
        AND (priorities IS NULL OR pi.priority::TEXT = ANY(priorities))
        
        -- Status filter
        AND (status_filters IS NULL OR pi.status::TEXT = ANY(status_filters))
        
        -- Project name filter
        AND (project_name_filter IS NULL OR pi.project_name ILIKE '%' || project_name_filter || '%')
        
        -- Assigned to filter
        AND (assigned_to_filter IS NULL OR pi.assigned_to ILIKE '%' || assigned_to_filter || '%')
        
        -- Date range filters
        AND (date_from IS NULL OR pi.source_date >= date_from)
        AND (date_to IS NULL OR pi.source_date <= date_to)
        
    ORDER BY 
        CASE WHEN search_query IS NOT NULL THEN search_rank END DESC,
        pi.priority DESC,
        pi.created_at DESC
    LIMIT match_count;
END;
$$;

-- Function to get insights for a specific document
CREATE OR REPLACE FUNCTION get_document_insights(
    doc_id TEXT,
    include_related BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    id BIGINT,
    insight_type TEXT,
    title TEXT,
    description TEXT,
    priority TEXT,
    status TEXT,
    assigned_to TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF include_related THEN
        RETURN QUERY
        SELECT 
            pi.id,
            pi.insight_type::TEXT,
            pi.title,
            pi.description,
            pi.priority::TEXT,
            pi.status::TEXT,
            pi.assigned_to,
            pi.due_date,
            pi.keywords,
            pi.created_at
        FROM project_insights pi
        WHERE pi.source_document_id = doc_id
           OR pi.id::TEXT = ANY(
               SELECT unnest(related_insights) 
               FROM project_insights 
               WHERE source_document_id = doc_id
           )
        ORDER BY pi.priority DESC, pi.created_at DESC;
    ELSE
        RETURN QUERY
        SELECT 
            pi.id,
            pi.insight_type::TEXT,
            pi.title,
            pi.description,
            pi.priority::TEXT,
            pi.status::TEXT,
            pi.assigned_to,
            pi.due_date,
            pi.keywords,
            pi.created_at
        FROM project_insights pi
        WHERE pi.source_document_id = doc_id
        ORDER BY pi.priority DESC, pi.created_at DESC;
    END IF;
END;
$$;

-- Create a view for active insights (open and in_progress)
CREATE OR REPLACE VIEW active_insights AS
SELECT 
    id,
    insight_type,
    title,
    description,
    confidence_score,
    priority,
    status,
    project_name,
    assigned_to,
    due_date,
    source_meeting_title,
    source_date,
    speakers,
    keywords,
    created_at,
    updated_at,
    CASE 
        WHEN due_date < NOW() THEN TRUE 
        ELSE FALSE 
    END as is_overdue,
    CASE 
        WHEN priority = 'critical' THEN 4
        WHEN priority = 'high' THEN 3
        WHEN priority = 'medium' THEN 2
        ELSE 1
    END as priority_score
FROM project_insights
WHERE status IN ('open', 'in_progress')
ORDER BY priority_score DESC, due_date ASC NULLS LAST, created_at DESC;

-- Add helpful comments for documentation
COMMENT ON TABLE project_insights IS 'AI-generated insights extracted from meeting transcripts and project documents';
COMMENT ON COLUMN project_insights.confidence_score IS 'AI confidence score from 0.0 to 1.0 for insight extraction quality';
COMMENT ON COLUMN project_insights.metadata IS 'Flexible JSON storage for additional insight metadata and context';
COMMENT ON FUNCTION get_insights_summary IS 'Generate summary statistics for insights over a specified time period';
COMMENT ON FUNCTION search_project_insights IS 'Advanced search function for project insights with multiple filters';
COMMENT ON VIEW active_insights IS 'View of active (open/in_progress) insights with priority scoring and overdue flags';