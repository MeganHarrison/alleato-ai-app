-- Projects Table for AI Agent Mastery Application
-- Stores project information with full CRUD support

-- Create enum types for projects
CREATE TYPE project_status AS ENUM (
    'active',
    'inactive',
    'completed',
    'on_hold',
    'planning'
);

CREATE TYPE project_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

-- Main projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core project information
    name TEXT NOT NULL,
    description TEXT,
    status project_status NOT NULL DEFAULT 'planning',
    priority project_priority NOT NULL DEFAULT 'medium',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Project ownership and team
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    owner_name TEXT NOT NULL,
    team_members TEXT[], -- Array of team member names
    
    -- Timeline
    start_date DATE,
    end_date DATE,
    
    -- Budget
    budget DECIMAL(12, 2),
    spent DECIMAL(12, 2) DEFAULT 0,
    
    -- Technologies and tags
    technologies TEXT[],
    tags TEXT[],
    
    -- Project details
    goals TEXT[],
    deliverables TEXT[],
    risks TEXT[],
    dependencies TEXT[],
    
    -- Links and resources
    repository_url TEXT,
    documentation_url TEXT,
    demo_url TEXT,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified_by UUID REFERENCES user_profiles(id),
    
    -- Soft delete
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by UUID REFERENCES user_profiles(id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects (owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects (priority);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_is_archived ON projects (is_archived);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects (start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects (end_date);

-- GIN indexes for array fields
CREATE INDEX IF NOT EXISTS idx_projects_team_members_gin ON projects USING GIN (team_members);
CREATE INDEX IF NOT EXISTS idx_projects_technologies_gin ON projects USING GIN (technologies);
CREATE INDEX IF NOT EXISTS idx_projects_tags_gin ON projects USING GIN (tags);

-- Full-text search index for name and description
CREATE INDEX IF NOT EXISTS idx_projects_fts ON projects USING GIN (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_timestamp();

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own projects
CREATE POLICY "Users can view their own projects"
ON projects 
FOR SELECT
USING (
    auth.uid() = owner_id 
    OR auth.uid() = ANY(
        SELECT unnest(ARRAY(SELECT up.id FROM user_profiles up WHERE up.full_name = ANY(team_members)))
    )
);

-- Users can create projects (they become the owner)
CREATE POLICY "Users can create projects"
ON projects 
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Owners can update their projects
CREATE POLICY "Owners can update their projects"
ON projects 
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Owners can delete (archive) their projects
CREATE POLICY "Owners can delete their projects"
ON projects 
FOR DELETE
USING (auth.uid() = owner_id);

-- Admins can view all projects
CREATE POLICY "Admins can view all projects"
ON projects 
FOR SELECT
USING (is_admin());

-- Admins can update all projects
CREATE POLICY "Admins can update all projects"
ON projects 
FOR UPDATE
USING (is_admin());

-- Admins can delete all projects
CREATE POLICY "Admins can delete all projects"
ON projects 
FOR DELETE
USING (is_admin());

-- Function to get projects summary for a user
CREATE OR REPLACE FUNCTION get_user_projects_summary(
    user_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
    total_projects BIGINT,
    active_projects BIGINT,
    completed_projects BIGINT,
    projects_by_status JSONB,
    projects_by_priority JSONB,
    overdue_projects BIGINT,
    upcoming_deadlines BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Use the provided user_id or default to the current user
    target_user_id := COALESCE(user_id_param, auth.uid());
    
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_projects,
        
        COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_projects,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_projects,
        
        -- Count by status
        jsonb_object_agg(
            DISTINCT status::TEXT,
            status_count
        ) as projects_by_status,
        
        -- Count by priority
        jsonb_object_agg(
            DISTINCT priority::TEXT,
            priority_count
        ) as projects_by_priority,
        
        -- Overdue projects count
        COUNT(*) FILTER (WHERE end_date < CURRENT_DATE AND status NOT IN ('completed', 'on_hold'))::BIGINT as overdue_projects,
        
        -- Upcoming deadlines (within 7 days)
        COUNT(*) FILTER (WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND status = 'active')::BIGINT as upcoming_deadlines
         
    FROM (
        SELECT 
            status,
            priority,
            end_date,
            COUNT(*) OVER (PARTITION BY status) as status_count,
            COUNT(*) OVER (PARTITION BY priority) as priority_count
        FROM projects
        WHERE owner_id = target_user_id
          AND is_archived = FALSE
    ) summary_data;
END;
$$;

-- Function to search projects with advanced filtering
CREATE OR REPLACE FUNCTION search_projects(
    search_query TEXT DEFAULT NULL,
    status_filters project_status[] DEFAULT NULL,
    priority_filters project_priority[] DEFAULT NULL,
    owner_filter UUID DEFAULT NULL,
    team_member_filter TEXT DEFAULT NULL,
    technology_filter TEXT DEFAULT NULL,
    date_from DATE DEFAULT NULL,
    date_to DATE DEFAULT NULL,
    include_archived BOOLEAN DEFAULT FALSE,
    match_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    status project_status,
    priority project_priority,
    progress INTEGER,
    owner_id UUID,
    owner_name TEXT,
    team_members TEXT[],
    start_date DATE,
    end_date DATE,
    budget DECIMAL,
    technologies TEXT[],
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    search_rank FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.priority,
        p.progress,
        p.owner_id,
        p.owner_name,
        p.team_members,
        p.start_date,
        p.end_date,
        p.budget,
        p.technologies,
        p.tags,
        p.created_at,
        p.updated_at,
        CASE 
            WHEN search_query IS NOT NULL THEN 
                ts_rank_cd(
                    to_tsvector('english', COALESCE(p.name, '') || ' ' || COALESCE(p.description, '')),
                    to_tsquery('english', search_query)
                )
            ELSE 0.0
        END as search_rank
    FROM projects p
    WHERE 
        -- Text search filter
        (search_query IS NULL OR 
         to_tsvector('english', COALESCE(p.name, '') || ' ' || COALESCE(p.description, '')) @@ to_tsquery('english', search_query))
        
        -- Status filter
        AND (status_filters IS NULL OR p.status = ANY(status_filters))
        
        -- Priority filter
        AND (priority_filters IS NULL OR p.priority = ANY(priority_filters))
        
        -- Owner filter
        AND (owner_filter IS NULL OR p.owner_id = owner_filter)
        
        -- Team member filter
        AND (team_member_filter IS NULL OR team_member_filter = ANY(p.team_members))
        
        -- Technology filter
        AND (technology_filter IS NULL OR technology_filter = ANY(p.technologies))
        
        -- Date range filters
        AND (date_from IS NULL OR p.start_date >= date_from)
        AND (date_to IS NULL OR p.end_date <= date_to)
        
        -- Archive filter
        AND (include_archived = TRUE OR p.is_archived = FALSE)
        
        -- Access control - user must be owner, team member, or admin
        AND (
            auth.uid() = p.owner_id 
            OR auth.uid() = ANY(
                SELECT unnest(ARRAY(SELECT up.id FROM user_profiles up WHERE up.full_name = ANY(p.team_members)))
            )
            OR is_admin()
        )
        
    ORDER BY 
        CASE WHEN search_query IS NOT NULL THEN search_rank END DESC,
        p.priority DESC,
        p.updated_at DESC
    LIMIT match_count;
END;
$$;

-- Create a view for active projects
CREATE OR REPLACE VIEW active_projects AS
SELECT 
    p.*,
    CASE 
        WHEN p.end_date < CURRENT_DATE THEN TRUE 
        ELSE FALSE 
    END as is_overdue,
    CASE 
        WHEN p.priority = 'critical' THEN 4
        WHEN p.priority = 'high' THEN 3
        WHEN p.priority = 'medium' THEN 2
        ELSE 1
    END as priority_score,
    up.email as owner_email,
    up.full_name as owner_full_name
FROM projects p
JOIN user_profiles up ON p.owner_id = up.id
WHERE p.status IN ('active', 'planning')
  AND p.is_archived = FALSE
ORDER BY priority_score DESC, p.end_date ASC NULLS LAST, p.created_at DESC;

-- Add helpful comments for documentation
COMMENT ON TABLE projects IS 'Main projects table for the AI Agent Mastery application';
COMMENT ON COLUMN projects.progress IS 'Project completion percentage from 0 to 100';
COMMENT ON COLUMN projects.metadata IS 'Flexible JSON storage for additional project metadata';
COMMENT ON FUNCTION get_user_projects_summary IS 'Generate summary statistics for a user''s projects';
COMMENT ON FUNCTION search_projects IS 'Advanced search function for projects with multiple filters';
COMMENT ON VIEW active_projects IS 'View of active and planning projects with additional computed fields';