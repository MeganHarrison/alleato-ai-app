#!/usr/bin/env python3
"""
Process only the remaining unprocessed transcript files.
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

def main():
    print("Processing REMAINING transcript files")
    print("=" * 60)

    # Get all transcript files
    files = supabase.storage.from_('meetings').list(path='transcripts')

    # Find only unprocessed files
    unprocessed_files = []
    for f in files:
        if f.get('metadata'):
            name = f.get('name', '')
            file_id = f'meetings/transcripts/{name}'

            # Check if already processed
            result = supabase.from_('document_metadata').select('id').eq('id', file_id).execute()

            if not result.data:  # Not processed yet
                unprocessed_files.append({
                    'name': name,
                    'full_path': f'transcripts/{name}',
                    'metadata': f.get('metadata', {})
                })

    # Sort by name (date)
    unprocessed_files.sort(key=lambda x: x['name'], reverse=True)

    print(f"Found {len(unprocessed_files)} unprocessed transcript files")
    print("-" * 60)

    if not unprocessed_files:
        print("All transcript files are already processed!")
        return

    # Show which files will be processed
    print("Files to process:")
    for f in unprocessed_files:
        print(f"  - {f['name']}")
    print("-" * 60)

    processed = 0
    errors = 0

    for i, file_info in enumerate(unprocessed_files, 1):
        name = file_info['name']
        full_path = file_info['full_path']

        print(f"\n[{i}/{len(unprocessed_files)}] Processing: {name}")

        try:
            # Download file
            print("  📥 Downloading...")
            file_content = supabase.storage.from_('meetings').download(full_path)

            if not file_content:
                print("  ❌ Failed to download")
                errors += 1
                continue

            # Extract text
            print("  📝 Extracting text...")
            text = extract_text_from_file(file_content, 'text/markdown', full_path)

            if not text:
                print("  ❌ No text extracted")
                errors += 1
                continue

            # Process for RAG
            print("  🔄 Vectorizing...")
            file_id = f"meetings/{full_path}"
            file_url = supabase.storage.from_('meetings').get_public_url(full_path)

            config = {
                'text_processing': {
                    'default_chunk_size': 400,
                    'default_chunk_overlap': 0
                }
            }

            success = process_file_for_rag(
                file_content=file_content,
                text=text,
                file_id=file_id,
                file_url=file_url,
                file_title=name,
                mime_type='text/markdown',
                config=config
            )

            if success:
                processed += 1
                print("  ✅ Success!")
            else:
                errors += 1
                print("  ❌ Failed to process")

        except Exception as e:
            errors += 1
            print(f"  ❌ Error: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "=" * 60)
    print(f"Processing complete!")
    print(f"✅ Processed: {processed} files")
    print(f"❌ Errors: {errors} files")

    # Final status check
    print("\nFinal status check:")
    remaining = supabase.storage.from_('meetings').list(path='transcripts')
    still_unprocessed = 0
    for f in remaining:
        if f.get('metadata'):
            name = f.get('name', '')
            file_id = f'meetings/transcripts/{name}'
            result = supabase.from_('document_metadata').select('id').eq('id', file_id).execute()
            if not result.data:
                still_unprocessed += 1

    print(f"Remaining unprocessed transcript files: {still_unprocessed}")

if __name__ == "__main__":
    main()