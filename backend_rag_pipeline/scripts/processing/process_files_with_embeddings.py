#!/usr/bin/env python3
"""
Process files from document_metadata that don't have embeddings yet.
Creates chunks and embeddings in the documents table.
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Supabase_Storage'))

from dotenv import load_dotenv
load_dotenv()

from supabase import create_client
from common.text_processor import extract_text_from_file
from common.db_handler import process_file_for_rag

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(supabase_url, supabase_key)

def get_files_without_embeddings():
    """Get all files from document_metadata that don't have embeddings."""
    print("🔍 Finding files without embeddings...")

    # Get all metadata records, ordered by date descending (most recent first)
    metadata_result = supabase.from_('document_metadata').select('*').order('date', desc=True).execute()

    files_without_embeddings = []

    for meta in metadata_result.data:
        file_id = meta['id']

        # Check if this file has chunks in documents table
        docs_result = supabase.from_('documents').select('id').eq('file_id', file_id).limit(1).execute()

        if not docs_result.data:  # No embeddings found
            files_without_embeddings.append(meta)

    # Already sorted by date from the query, but ensure most recent first
    # Handle None dates by putting them at the end
    files_without_embeddings.sort(key=lambda x: (x.get('date') is None, x.get('date', '')), reverse=True)

    return files_without_embeddings

def process_file_embeddings(metadata_record):
    """Process a single file to create embeddings."""
    file_id = metadata_record['id']
    title = metadata_record.get('title', file_id)
    content = metadata_record.get('content', '')
    url = metadata_record.get('url', '')
    project_id = metadata_record.get('project_id')  # Get project_id from metadata

    if not content:
        print(f"  ⚠️ No content found for {title}")
        return False

    try:
        # Configure chunking parameters with project_id
        config = {
            'text_processing': {
                'default_chunk_size': 400,
                'default_chunk_overlap': 0
            }
        }

        # Add project_id to config if it exists
        if project_id:
            config['project_id'] = project_id

        # Convert content to bytes for processing
        content_bytes = content.encode('utf-8') if isinstance(content, str) else content

        # Process file for RAG (creates chunks and embeddings)
        success = process_file_for_rag(
            file_content=content_bytes,
            text=content,
            file_id=file_id,
            file_url=url,
            file_title=title,
            mime_type='text/markdown',
            config=config
        )

        if success:
            # Verify chunks were created
            chunks = supabase.from_('documents').select('id').eq('file_id', file_id).limit(1).execute()
            if chunks.data:
                chunk_count = supabase.from_('documents').select('id', count='exact').eq('file_id', file_id).execute()
                print(f"  ✅ Created {chunk_count.count} chunks with embeddings")
                return True
            else:
                print(f"  ❌ No chunks created despite success flag")
                return False
        else:
            print(f"  ❌ Failed to process")
            return False

    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("\n" + "=" * 80)
    print("CREATING EMBEDDINGS FOR FILES WITHOUT EMBEDDINGS")
    print("=" * 80)

    # Get files without embeddings
    files_to_process = get_files_without_embeddings()

    if not files_to_process:
        print("✅ All files already have embeddings!")
        return

    print(f"\nFound {len(files_to_process)} files without embeddings")

    # Show the first few files to confirm they're most recent
    print("\n📅 Files will be processed from MOST RECENT to oldest:")
    print("-" * 80)
    for i, meta in enumerate(files_to_process[:5], 1):
        date = meta.get('date', 'No date')
        title = meta.get('title', meta['id'])[:60]
        print(f"{i}. {date} - {title}...")
    if len(files_to_process) > 5:
        print(f"... and {len(files_to_process) - 5} more files")
    print("-" * 80)

    # Ask user how many to process
    print("\nHow many files do you want to process?")
    print("1. All files")
    print("2. First 10 files (most recent)")
    print("3. First 50 files (most recent)")
    print("4. First 100 files (most recent)")
    print("5. Custom number")

    choice = input("\nEnter choice (1-5): ").strip()

    if choice == '1':
        limit = len(files_to_process)
    elif choice == '2':
        limit = 10
    elif choice == '3':
        limit = 50
    elif choice == '4':
        limit = 100
    elif choice == '5':
        custom = input("Enter number of files to process: ").strip()
        limit = int(custom) if custom.isdigit() else 10
    else:
        print("Invalid choice, processing first 10 files")
        limit = 10

    files_to_process = files_to_process[:limit]

    print(f"\n📝 Processing {len(files_to_process)} files...")
    print("-" * 80)

    successful = 0
    failed = 0

    for i, meta in enumerate(files_to_process, 1):
        title = meta.get('title', meta['id'])[:60]
        print(f"\n[{i}/{len(files_to_process)}] {meta.get('date', 'No date')} - {title}...")

        if process_file_embeddings(meta):
            successful += 1
        else:
            failed += 1

    # Summary
    print("\n" + "=" * 80)
    print("PROCESSING COMPLETE")
    print("=" * 80)
    print(f"✅ Successfully processed: {successful} files")
    print(f"❌ Failed: {failed} files")

    # Check remaining files
    remaining = get_files_without_embeddings()
    print(f"\n📊 Remaining files without embeddings: {len(remaining)}")

    if remaining:
        print("\nRun this script again to process more files.")

if __name__ == "__main__":
    main()