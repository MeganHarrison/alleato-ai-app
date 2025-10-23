#!/usr/bin/env python3
"""
Check Document Insights Database Schema

Verifies what columns currently exist in the document_insights table
and determines if we need to add the meeting date columns.
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
    print("❌ Supabase client not available. Install with: pip install supabase")
    SUPABASE_AVAILABLE = False


def check_database_schema():
    """Check the current database schema for document_insights table."""
    
    if not SUPABASE_AVAILABLE:
        return
    
    try:
        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            print("❌ Supabase credentials not found in environment")
            return
        
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Connected to Supabase successfully")
        
        # Check if document_insights table exists by trying to query it
        print("\n🔍 **CHECKING DOCUMENT_INSIGHTS TABLE**")
        print("=" * 60)
        
        try:
            # Try to get the first row to see the schema
            result = supabase.table('document_insights').select('*').limit(1).execute()
            
            if result.data:
                print(f"✅ Table exists with data ({len(result.data)} sample records)")
                
                # Show current schema
                sample_record = result.data[0]
                print(f"\n📋 **CURRENT SCHEMA** (from sample record):")
                for column, value in sample_record.items():
                    value_type = type(value).__name__
                    value_preview = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
                    print(f"   {column:<25} | {value_type:<10} | {value_preview}")
                
                # Check specifically for our new columns
                has_document_date = 'document_date' in sample_record
                has_meeting_date = 'meeting_date' in sample_record
                
                print(f"\n🎯 **NEW COLUMN STATUS:**")
                print(f"   document_date: {'✅ EXISTS' if has_document_date else '❌ MISSING'}")
                print(f"   meeting_date:  {'✅ EXISTS' if has_meeting_date else '❌ MISSING'}")
                
                if has_document_date and has_meeting_date:
                    print(f"\n🎉 **SCHEMA IS READY!** No SQL needed.")
                else:
                    print(f"\n⚠️  **SQL MIGRATION REQUIRED**")
                    show_required_sql()
                    
            else:
                print("✅ Table exists but is empty")
                print("\n⚠️  Cannot determine schema from empty table")
                print("🤔 **RECOMMENDATION:** Try inserting a test record to verify schema")
                
        except Exception as table_error:
            if "relation \"document_insights\" does not exist" in str(table_error):
                print("❌ Table 'document_insights' does not exist")
                print("\n📝 **FULL SCHEMA CREATION REQUIRED**")
                show_full_schema_sql()
            else:
                print(f"❌ Error querying table: {table_error}")
                print("\n🤔 **RECOMMENDATION:** Check table permissions and structure")
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")


def show_required_sql():
    """Show SQL to add missing date columns."""
    
    sql = """
-- Add meeting date columns to existing document_insights table
ALTER TABLE document_insights 
ADD COLUMN IF NOT EXISTS document_date DATE,
ADD COLUMN IF NOT EXISTS meeting_date DATE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_document_insights_document_date 
ON document_insights(document_date);

-- Add helpful comment
COMMENT ON COLUMN document_insights.document_date IS 'Date when the document/meeting actually occurred (YYYY-MM-DD)';
COMMENT ON COLUMN document_insights.meeting_date IS 'Alias for document_date, used for meeting-specific insights';
"""
    
    print("\n" + "="*60)
    print("🛠️  **REQUIRED SQL MIGRATION:**")
    print("="*60)
    print(sql)
    print("="*60)
    print("📋 **TO EXECUTE:**")
    print("1. Open Supabase Dashboard -> SQL Editor")
    print("2. Copy and paste the SQL above")
    print("3. Click 'RUN' to add the columns")
    print("4. Re-run this script to verify")


def show_full_schema_sql():
    """Show SQL to create the complete document_insights table."""
    
    sql = """
-- Create document_insights table with all required columns
CREATE TABLE document_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Core fields
    document_id TEXT NOT NULL,
    project_id INTEGER,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    generated_by TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    doc_title TEXT,
    
    -- Business impact fields  
    severity TEXT NOT NULL DEFAULT 'medium',
    business_impact TEXT,
    assignee TEXT,
    due_date DATE,
    financial_impact DECIMAL(12,2),
    urgency_indicators TEXT[],
    resolved BOOLEAN NOT NULL DEFAULT false,
    
    -- NEW: Date fields for RAG prioritization
    document_date DATE,  -- When document/meeting occurred
    meeting_date DATE,   -- Alias for document_date
    
    -- Context and relationships
    source_meetings TEXT[],
    dependencies TEXT[],
    stakeholders_affected TEXT[],
    exact_quotes TEXT[],
    numerical_data JSONB,
    critical_path_impact BOOLEAN NOT NULL DEFAULT false,
    cross_project_impact INTEGER[],
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_document_insights_document_id ON document_insights(document_id);
CREATE INDEX idx_document_insights_project_id ON document_insights(project_id);
CREATE INDEX idx_document_insights_severity ON document_insights(severity);
CREATE INDEX idx_document_insights_document_date ON document_insights(document_date);
CREATE INDEX idx_document_insights_created_at ON document_insights(created_at);

-- Add comments
COMMENT ON TABLE document_insights IS 'AI-extracted business insights from documents with meeting date intelligence';
COMMENT ON COLUMN document_insights.document_date IS 'Date when the document/meeting actually occurred (YYYY-MM-DD)';
COMMENT ON COLUMN document_insights.meeting_date IS 'Alias for document_date, used for meeting-specific insights';
"""
    
    print("\n" + "="*80)
    print("🏗️  **FULL TABLE CREATION SQL:**")
    print("="*80)
    print(sql)
    print("="*80)
    print("📋 **TO EXECUTE:**")
    print("1. Open Supabase Dashboard -> SQL Editor")
    print("2. Copy and paste the SQL above") 
    print("3. Click 'RUN' to create the table")
    print("4. Re-run this script to verify")


if __name__ == "__main__":
    print("🔍 **DOCUMENT INSIGHTS SCHEMA CHECK**")
    print("=" * 60)
    check_database_schema()
