-- ==============================================================================
-- Document Insights Table - Actual Production Schema
-- ==============================================================================
-- This file documents the ACTUAL document_insights table that exists in production
-- versus the project_insights table defined in 11-project_insights_schema.sql

-- IMPORTANT: There are TWO different insights tables:
-- 1. document_insights (THIS FILE) - Actually exists in production, used by Python backend
-- 2. project_insights (file 11) - Planned schema that was never fully implemented

-- ==============================================================================
-- ACTUAL PRODUCTION TABLE: document_insights
-- ==============================================================================

-- This table is actively used by the Python backend for storing AI-generated insights
-- from meeting transcripts and documents

CREATE TABLE IF NOT EXISTS document_insights (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Document association
    document_id TEXT NOT NULL,
    doc_title TEXT,

    -- Core insight fields
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    insight_type TEXT NOT NULL,  -- action_item, decision, risk, etc.

    -- Priority and status
    severity TEXT,  -- critical, high, medium, low (NOT "priority")
    confidence_score FLOAT,
    resolved BOOLEAN DEFAULT false,  -- NOT "status" enum

    -- Assignment and dates
    assignee TEXT,  -- NOT "assigned_to"
    due_date TIMESTAMP WITH TIME ZONE,

    -- Business impact fields
    business_impact TEXT,
    financial_impact NUMERIC,
    critical_path_impact BOOLEAN,
    timeline_impact_days INTEGER,

    -- Related data
    project_id INTEGER REFERENCES projects(id),
    stakeholders_affected TEXT[],
    dependencies TEXT[],
    cross_project_impact INTEGER[],

    -- Evidence and quotes
    exact_quotes TEXT[],
    source_meetings TEXT[],
    urgency_indicators TEXT[],

    -- Additional data
    numerical_data JSONB,
    metadata JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by TEXT DEFAULT 'ai_processor'
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_document_insights_document_id ON document_insights(document_id);
CREATE INDEX IF NOT EXISTS idx_document_insights_insight_type ON document_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_document_insights_severity ON document_insights(severity);
CREATE INDEX IF NOT EXISTS idx_document_insights_resolved ON document_insights(resolved);
CREATE INDEX IF NOT EXISTS idx_document_insights_assignee ON document_insights(assignee);
CREATE INDEX IF NOT EXISTS idx_document_insights_due_date ON document_insights(due_date);
CREATE INDEX IF NOT EXISTS idx_document_insights_created_at ON document_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_insights_project_id ON document_insights(project_id);

-- GIN indexes for arrays
CREATE INDEX IF NOT EXISTS idx_document_insights_stakeholders ON document_insights USING GIN (stakeholders_affected);
CREATE INDEX IF NOT EXISTS idx_document_insights_dependencies ON document_insights USING GIN (dependencies);
CREATE INDEX IF NOT EXISTS idx_document_insights_exact_quotes ON document_insights USING GIN (exact_quotes);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_document_insights_fts ON document_insights USING GIN (
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- ==============================================================================
-- MIGRATION: From project_insights to document_insights
-- ==============================================================================

-- If you have data in project_insights that needs to be migrated:
/*
INSERT INTO document_insights (
    title,
    description,
    insight_type,
    severity,  -- Map from priority
    resolved,  -- Map from status
    assignee,  -- Map from assigned_to
    due_date,
    doc_title,  -- Map from source_meeting_title
    metadata,
    created_at
)
SELECT
    title,
    description,
    insight_type::TEXT,
    priority::TEXT as severity,  -- Map priority to severity
    CASE
        WHEN status = 'completed' THEN true
        ELSE false
    END as resolved,
    assigned_to as assignee,
    due_date,
    source_meeting_title as doc_title,
    metadata,
    created_at
FROM project_insights
WHERE NOT EXISTS (
    SELECT 1 FROM document_insights di
    WHERE di.title = project_insights.title
    AND di.created_at = project_insights.created_at
);
*/

-- ==============================================================================
-- VIEW: Unified insights view (combines both tables if needed)
-- ==============================================================================

CREATE OR REPLACE VIEW unified_insights AS
SELECT
    id::TEXT as id,
    title,
    description,
    insight_type,
    severity,
    resolved,
    assignee,
    due_date,
    doc_title as source,
    'document' as source_type,
    created_at
FROM document_insights

UNION ALL

SELECT
    id::TEXT as id,
    title,
    description,
    insight_type::TEXT,
    priority::TEXT as severity,
    CASE
        WHEN status = 'completed' THEN true
        ELSE false
    END as resolved,
    assigned_to as assignee,
    due_date,
    COALESCE(source_meeting_title, project_name) as source,
    'project' as source_type,
    created_at
FROM project_insights
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_insights');

-- ==============================================================================
-- DIFFERENCES SUMMARY
-- ==============================================================================

/*
KEY DIFFERENCES between document_insights (actual) and project_insights (planned):

1. NAMING CONVENTIONS:
   - document_insights uses: severity, assignee, resolved
   - project_insights uses: priority, assigned_to, status

2. DATA TYPES:
   - document_insights: resolved is BOOLEAN
   - project_insights: status is ENUM (open, in_progress, completed, cancelled)

3. ADDITIONAL FIELDS in document_insights:
   - business_impact, financial_impact, critical_path_impact
   - timeline_impact_days, stakeholders_affected, dependencies
   - cross_project_impact, exact_quotes, urgency_indicators

4. MISSING FIELDS in document_insights:
   - speakers[] array
   - keywords[] array
   - related_insights[]
   - processed_by (uses generated_by instead)

5. PYTHON BACKEND EXPECTATION:
   The Python code expects document_insights table and uses severity/assignee/resolved naming
*/

-- ==============================================================================
-- RECOMMENDATION
-- ==============================================================================

/*
For consistency, you should:

1. Use document_insights as the primary insights table (it's what actually exists)
2. Update the frontend to use document_insights fields:
   - Use 'severity' instead of 'priority'
   - Use 'assignee' instead of 'assigned_to'
   - Use 'resolved' boolean instead of 'status' enum
3. If you need project-specific insights, add a project_id foreign key
4. Consider dropping the unused project_insights table if it has no data
*/