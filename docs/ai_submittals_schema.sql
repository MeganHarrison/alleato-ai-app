-- AI Submittals Agent Database Schema
-- Comprehensive schema for construction submittal management with AI-powered discrepancy detection

-- Core Project Management
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    project_number VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    owner_name VARCHAR(255),
    contractor_name VARCHAR(255),
    architect_name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    location JSONB, -- {address, city, state, country, coordinates}
    metadata JSONB, -- Additional project-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(255),
    role VARCHAR(100), -- 'architect', 'contractor', 'owner', 'engineer', 'consultant'
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    permissions JSONB, -- Role-based permissions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project team assignments
CREATE TABLE project_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL, -- 'project_manager', 'reviewer', 'submitter', 'observer'
    permissions JSONB, -- Project-specific permissions
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Specification Management
CREATE TABLE specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    section_number VARCHAR(50) NOT NULL, -- CSI format (e.g., "08 11 13")
    section_title VARCHAR(255) NOT NULL,
    division VARCHAR(50), -- Division 01-49
    specification_type VARCHAR(50) DEFAULT 'csi', -- 'csi', 'performance', 'prescriptive'
    document_url TEXT, -- Link to full spec document
    content TEXT, -- Extracted/parsed specification content
    requirements JSONB, -- Structured requirements extracted by AI
    keywords TEXT[], -- AI-extracted keywords for matching
    ai_summary TEXT, -- AI-generated summary
    version VARCHAR(50) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'superseded', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submittal Categories and Types
CREATE TABLE submittal_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL, -- 'product_data', 'shop_drawings', 'samples', 'certificates', 'reports'
    description TEXT,
    required_documents TEXT[], -- Required document types
    review_criteria JSONB, -- Standard review criteria
    ai_analysis_config JSONB, -- AI analysis configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Main Submittals Table
CREATE TABLE submittals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    specification_id UUID REFERENCES specifications(id),
    submittal_type_id UUID NOT NULL REFERENCES submittal_types(id),
    submittal_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    submitted_by UUID NOT NULL REFERENCES users(id),
    submitter_company VARCHAR(255),
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    required_approval_date DATE,
    priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'requires_revision', 'approved', 'rejected', 'superseded')),
    current_version INTEGER DEFAULT 1,
    total_versions INTEGER DEFAULT 1,
    metadata JSONB, -- Additional submittal metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, submittal_number)
);

-- Submittal Documents
CREATE TABLE submittal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100), -- 'drawing', 'spec_sheet', 'certificate', 'report', 'photo'
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    page_count INTEGER,
    extracted_text TEXT, -- AI-extracted text content
    ai_analysis JSONB, -- AI analysis results
    version INTEGER DEFAULT 1,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID NOT NULL REFERENCES users(id)
);

-- AI Discrepancy Detection
CREATE TABLE discrepancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
    specification_id UUID REFERENCES specifications(id),
    document_id UUID REFERENCES submittal_documents(id),
    discrepancy_type VARCHAR(100) NOT NULL, -- 'specification_mismatch', 'missing_information', 'incorrect_product', 'dimensional_error', 'performance_gap'
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    spec_requirement TEXT, -- What the spec requires
    submittal_content TEXT, -- What the submittal shows
    suggested_resolution TEXT, -- AI-suggested resolution
    confidence_score DECIMAL(3,2), -- AI confidence (0.00-1.00)
    location_in_doc JSONB, -- Page number, coordinates, etc.
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'waived', 'disputed')),
    identified_by VARCHAR(50) DEFAULT 'ai', -- 'ai', 'human', 'mixed'
    ai_model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review Workflow
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    review_type VARCHAR(50) NOT NULL, -- 'ai_preliminary', 'technical', 'design', 'compliance', 'final'
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    decision VARCHAR(50), -- 'approved', 'approved_with_conditions', 'rejected', 'requires_revision'
    comments TEXT,
    review_criteria_met JSONB, -- Checklist of met/unmet criteria
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review Comments and Markup
CREATE TABLE review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    document_id UUID REFERENCES submittal_documents(id),
    discrepancy_id UUID REFERENCES discrepancies(id),
    comment_type VARCHAR(50) DEFAULT 'general', -- 'general', 'markup', 'requirement', 'suggestion'
    comment TEXT NOT NULL,
    location_in_doc JSONB, -- Page, coordinates for markup
    priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'addressed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

-- AI Analysis Jobs and Results
CREATE TABLE ai_analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
    job_type VARCHAR(100) NOT NULL, -- 'discrepancy_detection', 'specification_matching', 'document_classification', 'content_extraction'
    status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    model_version VARCHAR(50),
    config JSONB, -- AI model configuration
    input_data JSONB, -- Input parameters
    results JSONB, -- Analysis results
    confidence_metrics JSONB, -- Overall confidence scores
    processing_time_ms INTEGER,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submittal History and Audit Trail
CREATE TABLE submittal_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submittal_id UUID NOT NULL REFERENCES submittals(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- 'created', 'submitted', 'reviewed', 'approved', 'rejected', 'revised'
    actor_id UUID REFERENCES users(id),
    actor_type VARCHAR(50) DEFAULT 'user', -- 'user', 'system', 'ai'
    description TEXT,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    changes JSONB, -- What changed
    metadata JSONB, -- Additional context
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication and Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    submittal_id UUID REFERENCES submittals(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL, -- 'submittal_received', 'review_required', 'discrepancy_found', 'approval_due', 'status_changed'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    delivery_methods TEXT[] DEFAULT ARRAY['in_app'], -- 'in_app', 'email', 'sms'
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Configuration
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    version VARCHAR(50) NOT NULL,
    model_type VARCHAR(100) NOT NULL, -- 'discrepancy_detection', 'text_extraction', 'classification', 'matching'
    description TEXT,
    config JSONB, -- Model configuration
    performance_metrics JSONB, -- Accuracy, precision, recall, etc.
    is_active BOOLEAN DEFAULT true,
    deployment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics and Reporting
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    project_id UUID REFERENCES projects(id),
    submittal_id UUID REFERENCES submittals(id),
    user_id UUID REFERENCES users(id),
    event_data JSONB, -- Event-specific data
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance tracking
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    metric_type VARCHAR(100) NOT NULL, -- 'review_time', 'discrepancy_accuracy', 'approval_rate', 'revision_cycles'
    metric_name VARCHAR(255) NOT NULL,
    value DECIMAL(10,4),
    unit VARCHAR(50),
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_submittals_project_id ON submittals(project_id);
CREATE INDEX idx_submittals_status ON submittals(status);
CREATE INDEX idx_submittals_submission_date ON submittals(submission_date);
CREATE INDEX idx_submittals_number ON submittals(submittal_number);

CREATE INDEX idx_discrepancies_submittal_id ON discrepancies(submittal_id);
CREATE INDEX idx_discrepancies_severity ON discrepancies(severity);
CREATE INDEX idx_discrepancies_status ON discrepancies(status);
CREATE INDEX idx_discrepancies_type ON discrepancies(discrepancy_type);

CREATE INDEX idx_reviews_submittal_id ON reviews(submittal_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_due_date ON reviews(due_date);

CREATE INDEX idx_documents_submittal_id ON submittal_documents(submittal_id);
CREATE INDEX idx_history_submittal_id ON submittal_history(submittal_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

CREATE INDEX idx_specifications_project_id ON specifications(project_id);
CREATE INDEX idx_specifications_section ON specifications(section_number);
CREATE INDEX idx_project_users_project_id ON project_users(project_id);
CREATE INDEX idx_project_users_user_id ON project_users(user_id);

-- Full-text search indexes
CREATE INDEX idx_specifications_content_search ON specifications USING gin(to_tsvector('english', content));
CREATE INDEX idx_documents_text_search ON submittal_documents USING gin(to_tsvector('english', extracted_text));
CREATE INDEX idx_discrepancies_search ON discrepancies USING gin(to_tsvector('english', title || ' ' || description));

-- JSONB indexes for efficient queries
CREATE INDEX idx_specifications_requirements ON specifications USING gin(requirements);
CREATE INDEX idx_submittals_metadata ON submittals USING gin(metadata);
CREATE INDEX idx_ai_analysis_results ON ai_analysis_jobs USING gin(results);
CREATE INDEX idx_discrepancies_location ON discrepancies USING gin(location_in_doc);

-- Views for common queries
CREATE VIEW active_submittals AS
SELECT 
    s.*,
    p.name as project_name,
    u.first_name || ' ' || u.last_name as submitted_by_name,
    st.name as submittal_type_name,
    COUNT(d.id) as discrepancy_count,
    COUNT(CASE WHEN d.severity = 'critical' THEN 1 END) as critical_discrepancies
FROM submittals s
JOIN projects p ON s.project_id = p.id
JOIN users u ON s.submitted_by = u.id
JOIN submittal_types st ON s.submittal_type_id = st.id
LEFT JOIN discrepancies d ON s.id = d.submittal_id AND d.status = 'open'
WHERE s.status NOT IN ('approved', 'rejected', 'superseded')
GROUP BY s.id, p.name, u.first_name, u.last_name, st.name;

CREATE VIEW project_dashboard AS
SELECT 
    p.id,
    p.name,
    p.status,
    COUNT(s.id) as total_submittals,
    COUNT(CASE WHEN s.status = 'submitted' THEN 1 END) as pending_submittals,
    COUNT(CASE WHEN s.status = 'under_review' THEN 1 END) as under_review,
    COUNT(CASE WHEN s.status = 'approved' THEN 1 END) as approved_submittals,
    COUNT(CASE WHEN s.status = 'requires_revision' THEN 1 END) as needs_revision,
    COUNT(d.id) as total_discrepancies,
    COUNT(CASE WHEN d.severity = 'critical' THEN 1 END) as critical_discrepancies,
    AVG(EXTRACT(days FROM (COALESCE(r.completed_at, NOW()) - s.submission_date))) as avg_review_time_days
FROM projects p
LEFT JOIN submittals s ON p.id = s.project_id
LEFT JOIN discrepancies d ON s.id = d.submittal_id AND d.status = 'open'
LEFT JOIN reviews r ON s.id = r.submittal_id AND r.review_type = 'final'
GROUP BY p.id, p.name, p.status;

-- Triggers for updated_at fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_specifications_updated_at BEFORE UPDATE ON specifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submittals_updated_at BEFORE UPDATE ON submittals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discrepancies_updated_at BEFORE UPDATE ON discrepancies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for submittal history tracking
CREATE OR REPLACE FUNCTION track_submittal_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO submittal_history (
            submittal_id, 
            action, 
            description, 
            previous_status, 
            new_status,
            changes
        ) VALUES (
            NEW.id,
            'status_changed',
            'Status changed from ' || OLD.status || ' to ' || NEW.status,
            OLD.status,
            NEW.status,
            jsonb_build_object('field', 'status', 'old_value', OLD.status, 'new_value', NEW.status)
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER track_submittal_status_changes 
    AFTER UPDATE ON submittals 
    FOR EACH ROW 
    EXECUTE FUNCTION track_submittal_changes();

-- Sample data for submittal types
INSERT INTO submittal_types (name, category, description, required_documents, review_criteria) VALUES
('Product Data Sheets', 'product_data', 'Manufacturer product specifications and data sheets', ARRAY['specification_sheet', 'performance_data'], '{"compliance": true, "performance_match": true, "manufacturer_approved": true}'),
('Shop Drawings', 'shop_drawings', 'Detailed fabrication and installation drawings', ARRAY['technical_drawing', 'installation_guide'], '{"dimensional_accuracy": true, "design_compliance": true, "fabrication_details": true}'),
('Material Samples', 'samples', 'Physical samples of materials and finishes', ARRAY['sample', 'color_chart'], '{"visual_approval": true, "quality_standards": true, "specification_match": true}'),
('Test Reports', 'reports', 'Material testing and certification reports', ARRAY['test_report', 'certificate'], '{"test_compliance": true, "standards_met": true, "lab_accreditation": true}'),
('Operating Manuals', 'reports', 'Equipment operation and maintenance manuals', ARRAY['manual', 'warranty'], '{"completeness": true, "language_requirements": true, "digital_format": true}');

COMMENT ON TABLE submittals IS 'Main table for construction submittals with AI-powered workflow management';
COMMENT ON TABLE discrepancies IS 'AI-detected discrepancies between specifications and submittals';
COMMENT ON TABLE ai_analysis_jobs IS 'Tracking AI analysis jobs and their results for submittals';
COMMENT ON TABLE specifications IS 'Project specifications with AI-extracted requirements and keywords';
COMMENT ON TABLE reviews IS 'Submittal review workflow with human and AI participation';
