#!/usr/bin/env python3
"""
Sync Project IDs from document_metadata to documents table

This script links the project_id from document_metadata (set by Supabase triggers)
to the documents table so RAG queries work properly.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load environment
load_dotenv(Path(__file__).parent / '.env')
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

def sync_project_ids():
    """Sync project_id from document_metadata to documents table"""
    
    print("🔗 SYNCING PROJECT IDs FROM METADATA TO DOCUMENTS")
    print("=" * 60)
    
    # Get all metadata records with project_id
    metadata_with_projects = supabase.table('document_metadata').select('id, title, project_id').not_.is_('project_id', 'null').execute()
    
    print(f"📋 Found {len(metadata_with_projects.data)} metadata records with project_id")
    
    updated_count = 0
    for meta in metadata_with_projects.data:
        file_id = meta['id']
        project_id = meta['project_id'] 
        title = meta.get('title', 'Untitled')
        
        # Find matching documents using the file_id in metadata JSON
        docs = supabase.table('documents').select('id, title').eq("metadata->>file_id", file_id).execute()
        
        if docs.data:
            print(f"\n📄 Processing: {title}")
            print(f"   File ID: {file_id}")
            print(f"   Project ID: {project_id}")
            print(f"   Found {len(docs.data)} document chunks")
            
            # Update all document chunks with the project_id
            for doc in docs.data:
                supabase.table('documents').update({'project_id': project_id}).eq('id', doc['id']).execute()
                updated_count += 1
        else:
            print(f"⚠️  No documents found for file_id: {file_id} ({title})")
    
    print(f"\n✅ Successfully updated {updated_count} document records")
    return updated_count

def verify_sync():
    """Verify the sync worked correctly"""
    print("\n🔍 VERIFICATION - Documents by Project:")
    print("=" * 50)
    
    # Group documents by project_id
    docs = supabase.table('documents').select('id, title, project_id, metadata').not_.is_('project_id', 'null').execute()
    
    projects = {}
    for doc in docs.data:
        project_id = doc['project_id']
        title = doc.get('title') or doc.get('metadata', {}).get('file_title', 'Untitled')
        
        if project_id not in projects:
            projects[project_id] = []
        projects[project_id].append(title)
    
    for project_id, titles in projects.items():
        unique_titles = list(set(titles))  # Remove duplicates (chunks from same file)
        print(f"\n📁 Project {project_id}: {len(unique_titles)} unique documents")
        for title in unique_titles[:5]:  # Show first 5
            print(f"   - {title}")
        if len(unique_titles) > 5:
            print(f"   ... and {len(unique_titles) - 5} more")

if __name__ == "__main__":
    print("🚀 Project ID Sync Tool")
    print("=" * 30)
    
    try:
        updated = sync_project_ids()
        verify_sync()
        
        print(f"\n🎯 SUMMARY:")
        print(f"   Updated {updated} document records")
        print(f"   RAG queries should now work by project!")
        print(f"   Try: 'Tell me about the Westfield Collective project'")
        
    except Exception as e:
        print(f"❌ Error: {e}")
