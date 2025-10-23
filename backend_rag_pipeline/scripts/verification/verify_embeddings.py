#!/usr/bin/env python3
"""
Verify which documents have embeddings created by linking documents and document_metadata tables.
"""

import os
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(supabase_url, supabase_key)

def verify_embeddings():
    """
    Check which files in document_metadata have corresponding embeddings in documents table.
    """
    print("\n" + "=" * 80)
    print("EMBEDDING VERIFICATION REPORT")
    print("=" * 80)

    # Get all records from document_metadata
    print("\n📊 Fetching document metadata...")
    metadata_result = supabase.from_('document_metadata').select('*').execute()

    if not metadata_result.data:
        print("❌ No records found in document_metadata")
        return

    print(f"Found {len(metadata_result.data)} records in document_metadata")

    # Categories for tracking
    has_embeddings = []
    missing_embeddings = []

    # Check each metadata record for corresponding embeddings
    print("\n🔍 Checking for embeddings in documents table...")

    for meta in metadata_result.data:
        file_id = meta['id']

        # Check if this file_id has any chunks in documents table
        docs_result = supabase.from_('documents').select('id').eq('file_id', file_id).limit(1).execute()

        if docs_result.data:
            has_embeddings.append(meta)
        else:
            missing_embeddings.append(meta)

    # Display results
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Files WITH embeddings: {len(has_embeddings)}")
    print(f"❌ Files WITHOUT embeddings: {len(missing_embeddings)}")
    print(f"📊 Total files: {len(metadata_result.data)}")
    print(f"📈 Coverage: {len(has_embeddings) / len(metadata_result.data) * 100:.1f}%")

    # Show files with embeddings (recent first)
    if has_embeddings:
        print("\n" + "-" * 80)
        print("✅ FILES WITH EMBEDDINGS (showing recent 10)")
        print("-" * 80)
        has_embeddings.sort(key=lambda x: x.get('date', ''), reverse=True)
        for i, meta in enumerate(has_embeddings[:10], 1):
            # Get chunk count for this file
            chunk_count = supabase.from_('documents').select('id', count='exact').eq('file_id', meta['id']).execute()
            print(f"{i}. {meta.get('date', 'No date')} - {meta.get('title', meta['id'])[:60]}...")
            print(f"   Chunks: {chunk_count.count}, ID: {meta['id']}")

    # Show files missing embeddings (all or up to 20)
    if missing_embeddings:
        print("\n" + "-" * 80)
        print(f"❌ FILES WITHOUT EMBEDDINGS ({len(missing_embeddings)} total)")
        print("-" * 80)
        missing_embeddings.sort(key=lambda x: x.get('date', ''), reverse=True)
        for i, meta in enumerate(missing_embeddings[:20], 1):
            print(f"{i}. {meta.get('date', 'No date')} - {meta.get('title', meta['id'])[:60]}...")
            print(f"   ID: {meta['id']}")
            if meta.get('storage_bucket_path'):
                print(f"   Path: {meta['storage_bucket_path']}")

        if len(missing_embeddings) > 20:
            print(f"\n... and {len(missing_embeddings) - 20} more files without embeddings")

    # Check for orphaned embeddings (chunks without metadata)
    print("\n" + "-" * 80)
    print("🔍 Checking for orphaned embeddings...")
    print("-" * 80)

    # Get unique file_ids from documents table
    docs_file_ids = supabase.from_('documents').select('file_id').execute()
    unique_file_ids = set([d['file_id'] for d in docs_file_ids.data if d['file_id']])

    # Get all ids from document_metadata
    metadata_ids = set([m['id'] for m in metadata_result.data])

    # Find orphaned file_ids (in documents but not in metadata)
    orphaned_ids = unique_file_ids - metadata_ids

    if orphaned_ids:
        print(f"⚠️  Found {len(orphaned_ids)} file IDs with embeddings but no metadata:")
        for i, file_id in enumerate(list(orphaned_ids)[:10], 1):
            chunk_count = supabase.from_('documents').select('id', count='exact').eq('file_id', file_id).execute()
            print(f"   {i}. {file_id} ({chunk_count.count} chunks)")
    else:
        print("✅ No orphaned embeddings found")

    # Recommendations
    print("\n" + "=" * 80)
    print("📋 RECOMMENDATIONS")
    print("=" * 80)

    if missing_embeddings:
        print(f"\n1. Create embeddings for {len(missing_embeddings)} files without embeddings")
        print("   Run: python process_files_with_embeddings.py")

    if orphaned_ids:
        print(f"\n2. Clean up {len(orphaned_ids)} orphaned embedding sets")
        print("   These have embeddings but no metadata record")

    if not missing_embeddings and not orphaned_ids:
        print("\n✅ All files are properly linked with embeddings!")

    # Show date range of processed files
    all_dates = [m.get('date') for m in metadata_result.data if m.get('date')]
    if all_dates:
        all_dates.sort()
        print(f"\n📅 Date range: {all_dates[0]} to {all_dates[-1]}")

if __name__ == "__main__":
    verify_embeddings()