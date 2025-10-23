#!/usr/bin/env python3
"""
Database Schema Migration for Meeting Date Fields

This script will:
1. Check if document_insights table exists
2. Check if the new date fields exist
3. Create/migrate the table as needed
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path  
project_root = Path(__file__).resolve().parent
sys.path.append(str(project_root))

# Load environment variables
load_dotenv()

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    print("❌ Supabase client not available")
    SUPABASE_AVAILABLE = False


def get_supabase_client():
    """Get authenticated Supabase client."""
    if not SUPABASE_AVAILABLE:
        return None
        
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase credentials not found")
        print("Need: SUPABASE_URL and SUPABASE_SERVICE_KEY")
        return None
    
    return create_client(supabase_url, supabase_key)


def find_insights_table(supabase):
    """Find which insights table actually exists."""
    
    possible_tables = [
        'document_insights',
        'ai_insights', 
        'meeting_insights',
        'insights',
        'business_insights'
    ]
    
    existing_tables = []
    
    for table_name in possible_tables:
        try:
            result = supabase.table(table_name).select('*').limit(0).execute()
            existing_tables.append(table_name)
            print(f"✅ Found table: {table_name}")
        except Exception as e:
            if "relation" not in str(e).lower() and "does not exist" not in str(e).lower():
                print(f"⚠️ Error checking {table_name}: {e}")
    
    return existing_tables


def check_table_schema(supabase, table_name):
    """Check if table has the required date fields."""
    
    try:
        # Get a sample record to check schema
        result = supabase.table(table_name).select('*').limit(1).execute()
        
        if result.data and len(result.data) > 0:
            record = result.data[0]
            fields = list(record.keys())
            
            has_document_date = 'document_date' in fields
            has_meeting_date = 'meeting_date' in fields
            
            print(f"\n📊 **TABLE: {table_name}**")
            print(f"📅 document_date: {'✅ EXISTS' if has_document_date else '❌ MISSING'}")
            print(f"📅 meeting_date: {'✅ EXISTS' if has_meeting_date else '❌ MISSING'}")
            
            print(f"\n🔍 **ALL FIELDS:**")
            for field in sorted(fields):
                print(f"   - {field}")
            
            return has_document_date, has_meeting_date, fields
        else:
            print(f"ℹ️ Table {table_name} exists but is empty - cannot check schema")
            return None, None, []
            
    except Exception as e:
        print(f"❌ Error checking {table_name}: {e}")
        return None, None, []


def create_migration_sql(table_name, has_document_date, has_meeting_date):
    """Generate SQL migration commands."""
    
    migrations = []
    
    if not has_document_date:
        migrations.append(f"ALTER TABLE {table_name} ADD COLUMN document_date DATE;")
        migrations.append(f"COMMENT ON COLUMN {table_name}.document_date IS 'Date when the document/meeting actually occurred';")
    
    if not has_meeting_date:
        migrations.append(f"ALTER TABLE {table_name} ADD COLUMN meeting_date DATE;")
        migrations.append(f"COMMENT ON COLUMN {table_name}.meeting_date IS 'Alias for document_date for meeting-specific contexts';")
    
    # Add indexes for performance
    if not has_document_date:
        migrations.append(f"CREATE INDEX idx_{table_name}_document_date ON {table_name}(document_date DESC);")
    
    if not has_meeting_date:
        migrations.append(f"CREATE INDEX idx_{table_name}_meeting_date ON {table_name}(meeting_date DESC);")
    
    return migrations


def apply_migration(supabase, migration_sql):
    """Apply migration SQL (if Supabase supports raw SQL)."""
    
    print("⚠️  **MANUAL MIGRATION REQUIRED**")
    print("Supabase Python client doesn't support raw SQL execution.")
    print("Please run these commands in your Supabase SQL editor:")
    print("\n" + "="*60)
    
    for sql in migration_sql:
        print(sql)
    
    print("="*60)


def create_complete_table_sql():
    """Generate complete table creation SQL if no table exists."""
    
    return """
-- Create the document_insights table with meeting date fields
CREATE TABLE IF NOT EXISTS document_insights (
    id SERIAL PRIMARY KEY,
    document_id TEXT NOT NULL,
    project_id INTEGER,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence_score FLOAT NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    generated_by TEXT DEFAULT 'gpt-4o-mini',
    doc_title TEXT,
    
    -- Business impact fields
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    business_impact TEXT,
    assignee TEXT,
    due_date DATE,
    financial_impact DECIMAL,
    urgency_indicators TEXT[],
    resolved BOOLEAN DEFAULT false,
    
    -- NEW DATE FIELDS - Meeting date intelligence
    document_date DATE,  -- When the document/meeting actually occurred
    meeting_date DATE,   -- Alias for document_date
    
    -- Context and relationships
    source_meetings TEXT[],
    dependencies TEXT[],
    stakeholders_affected TEXT[],
    exact_quotes TEXT[],
    numerical_data JSONB,
    critical_path_impact BOOLEAN DEFAULT false,
    cross_project_impact INTEGER[],
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_document_insights_document_id ON document_insights(document_id);
CREATE INDEX IF NOT EXISTS idx_document_insights_project_id ON document_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_document_insights_document_date ON document_insights(document_date DESC);
CREATE INDEX IF NOT EXISTS idx_document_insights_meeting_date ON document_insights(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_document_insights_created_at ON document_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_insights_severity ON document_insights(severity);
CREATE INDEX IF NOT EXISTS idx_document_insights_insight_type ON document_insights(insight_type);

-- Add comments for clarity
COMMENT ON TABLE document_insights IS 'AI-generated business insights from documents with meeting date intelligence';
COMMENT ON COLUMN document_insights.document_date IS 'Date when the document/meeting actually occurred (vs created_at which is processing time)';
COMMENT ON COLUMN document_insights.meeting_date IS 'Alias for document_date for meeting-specific contexts';
COMMENT ON COLUMN document_insights.financial_impact IS 'Financial impact in dollars (positive or negative)';
COMMENT ON COLUMN document_insights.confidence_score IS 'AI confidence score between 0.0 and 1.0';
"""


def main():
    """Main migration check and execution."""
    
    print("🔍 **DATABASE SCHEMA MIGRATION CHECK**")
    print("=" * 60)
    
    supabase = get_supabase_client()
    if not supabase:
        return
    
    print("✅ Connected to Supabase")
    
    # Find existing insights tables
    existing_tables = find_insights_table(supabase)
    
    if not existing_tables:
        print("\n❌ No insights tables found!")
        print("\n🛠️  **COMPLETE TABLE CREATION NEEDED:**")
        print("Run this SQL in your Supabase SQL editor:")
        print("\n" + "="*60)
        print(create_complete_table_sql())
        print("="*60)
        return
    
    # Check each existing table
    needs_migration = False
    all_migrations = []
    
    for table_name in existing_tables:
        has_doc_date, has_meeting_date, fields = check_table_schema(supabase, table_name)
        
        if has_doc_date is None:  # Empty table
            continue
            
        if not has_doc_date or not has_meeting_date:
            needs_migration = True
            migrations = create_migration_sql(table_name, has_doc_date, has_meeting_date)
            all_migrations.extend(migrations)
    
    if needs_migration:
        print(f"\n🛠️  **MIGRATION REQUIRED:**")
        apply_migration(supabase, all_migrations)
    else:
        print(f"\n🎉 **ALL TABLES UP TO DATE!**")
        print("All insights tables have the required date fields.")
    
    print(f"\n📋 **SUMMARY:**")
    print(f"Found {len(existing_tables)} insights table(s): {', '.join(existing_tables)}")
    print(f"Migration needed: {'YES' if needs_migration else 'NO'}")


if __name__ == "__main__":
    main()
