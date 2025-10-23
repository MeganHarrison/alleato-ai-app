#!/usr/bin/env python3
"""
Continue re-processing files with the new advanced chunking strategy.
This script detects which files have already been processed with the new chunking
and skips them, only processing files that still have old chunks.
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from statistics import mean, median

sys.path.insert(0, str(Path(__file__).parent.parent.parent))
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'Supabase_Storage'))

from dotenv import load_dotenv
load_dotenv()

from supabase import create_client
from common.text_processor import extract_text_from_file
from common.db_handler import process_file_for_rag

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(supabase_url, supabase_key)

# Load advanced chunking configuration
config_path = Path(__file__).parent.parent.parent / 'config_advanced_chunking.json'
with open(config_path, 'r') as f:
    advanced_config = json.load(f)

def check_if_already_processed(file_id: str) -> tuple[bool, float, int]:
    """
    Check if a file has already been processed with new chunking.
    Returns (is_processed, avg_chunk_size, chunk_count)
    """
    try:
        # Get chunks for this file
        chunks = supabase.from_('documents') \
            .select('content') \
            .eq('file_id', file_id) \
            .execute()

        if not chunks.data:
            return False, 0, 0

        # Calculate average chunk size
        chunk_sizes = [len(chunk.get('content', '')) for chunk in chunks.data]
        avg_size = mean(chunk_sizes) if chunk_sizes else 0

        # Files with new chunking will have average chunk sizes closer to 1500
        # Old chunks averaged around 400 chars
        # We'll consider it "new" if average size is > 1000 (midpoint between old and new)
        is_new = avg_size > 1000

        return is_new, avg_size, len(chunks.data)

    except Exception as e:
        print(f"  ⚠️ Error checking chunks: {e}")
        return False, 0, 0

def get_all_files_with_content():
    """Get all files from document_metadata that have content."""
    print("🔍 Fetching all files from document_metadata...")

    # Get all metadata records with content
    metadata_result = supabase.from_('document_metadata') \
        .select('*') \
        .not_.is_('content', 'null') \
        .order('date', desc=True) \
        .execute()

    files = metadata_result.data or []

    # Filter out files without content
    files_with_content = [f for f in files if f.get('content')]

    return files_with_content

def analyze_current_state():
    """Analyze the current state of chunking across all files."""
    print("\n📊 Analyzing current chunking state...")

    files = get_all_files_with_content()

    old_chunking = []
    new_chunking = []
    no_chunks = []

    for file_meta in files:
        file_id = file_meta['id']
        title = file_meta.get('title', file_id)[:40]

        is_new, avg_size, count = check_if_already_processed(file_id)

        if count == 0:
            no_chunks.append((title, file_id))
        elif is_new:
            new_chunking.append((title, file_id, avg_size, count))
        else:
            old_chunking.append((title, file_id, avg_size, count))

    print(f"\n📈 Chunking Analysis Results:")
    print(f"  ✅ Already processed with NEW chunking: {len(new_chunking)} files")
    print(f"  ⏳ Still using OLD chunking: {len(old_chunking)} files")
    print(f"  ❌ No chunks found: {len(no_chunks)} files")

    if new_chunking:
        avg_sizes = [x[2] for x in new_chunking]
        print(f"\n  New chunking stats:")
        print(f"    - Average chunk size: {mean(avg_sizes):.0f} chars")
        print(f"    - Median chunk size: {median(avg_sizes):.0f} chars")

    if old_chunking:
        avg_sizes = [x[2] for x in old_chunking]
        print(f"\n  Old chunking stats:")
        print(f"    - Average chunk size: {mean(avg_sizes):.0f} chars")
        print(f"    - Median chunk size: {median(avg_sizes):.0f} chars")

    return old_chunking, new_chunking, no_chunks

def delete_existing_chunks(file_id: str):
    """Delete existing chunks for a file."""
    try:
        # Delete from documents table
        result = supabase.from_('documents') \
            .delete() \
            .eq('file_id', file_id) \
            .execute()

        # Count how many were deleted (for logging)
        count_result = supabase.from_('documents') \
            .select('id', count='exact') \
            .eq('file_id', file_id) \
            .execute()

        deleted_count = count_result.count if hasattr(count_result, 'count') else 0

        return deleted_count

    except Exception as e:
        print(f"  ⚠️ Error deleting chunks: {e}")
        return 0

def process_file_with_new_chunking(metadata_record):
    """Process a single file with the new chunking strategy."""
    file_id = metadata_record['id']
    title = metadata_record.get('title', file_id)
    content = metadata_record.get('content', '')
    url = metadata_record.get('url', '')
    project_id = metadata_record.get('project_id')

    if not content:
        print(f"  ⚠️ No content found for {title}")
        return False, 0, 0

    try:
        # Delete existing chunks first
        deleted_count = delete_existing_chunks(file_id)
        if deleted_count > 0:
            print(f"  🗑️ Deleted {deleted_count} old chunks")

        # Use the new advanced chunking configuration
        config = {
            'text_processing': {
                'default_chunk_size': advanced_config['text_processing']['default_chunk_size'],  # 1500
                'default_chunk_overlap': advanced_config['text_processing']['default_chunk_overlap']  # 300
            }
        }

        # Add project_id if provided
        if project_id is not None:
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
            # Count new chunks created
            chunks = supabase.from_('documents') \
                .select('id', count='exact') \
                .eq('file_id', file_id) \
                .execute()

            new_count = chunks.count if hasattr(chunks, 'count') else 0
            print(f"  ✅ Created {new_count} new chunks (was {deleted_count})")
            return True, deleted_count, new_count
        else:
            print(f"  ❌ Failed to process")
            return False, deleted_count, 0

    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False, 0, 0

def main():
    print("\n" + "=" * 80)
    print("CONTINUE RE-PROCESSING WITH NEW CHUNKING STRATEGY")
    print("=" * 80)

    # Display new chunking settings
    print("\n📊 New Chunking Configuration:")
    print(f"  - Chunk Size: {advanced_config['text_processing']['default_chunk_size']} chars (was 400)")
    print(f"  - Chunk Overlap: {advanced_config['text_processing']['default_chunk_overlap']} chars (was 0)")
    print(f"  - Min Size: {advanced_config['text_processing']['min_chunk_size']} chars")
    print(f"  - Max Size: {advanced_config['text_processing']['max_chunk_size']} chars")

    # Analyze current state
    old_chunking, new_chunking, no_chunks = analyze_current_state()

    # Get files that need processing
    files_to_process = []

    # Get full metadata for files that need processing
    all_files = get_all_files_with_content()
    files_to_process_ids = set([f[1] for f in old_chunking] + [f[1] for f in no_chunks])

    files_to_process = [f for f in all_files if f['id'] in files_to_process_ids]

    if not files_to_process:
        print("\n✨ All files are already processed with new chunking!")
        return

    print(f"\n📝 Found {len(files_to_process)} files that need processing")
    print(f"   ({len(old_chunking)} with old chunks, {len(no_chunks)} with no chunks)")

    # Show what will be skipped
    if new_chunking:
        print(f"\n✅ Skipping {len(new_chunking)} files already processed with new chunking")
        print("   Sample of files being skipped:")
        for title, file_id, avg_size, count in new_chunking[:5]:
            print(f"     - {title}: {count} chunks, avg {avg_size:.0f} chars")

    # Get confirmation
    print("\n" + "⚠️ " * 20)
    print("This will process ONLY files that haven't been updated yet.")
    print("Files with new chunking (avg size > 1000 chars) will be SKIPPED.")
    print("⚠️ " * 20)

    confirm = input("\nDo you want to continue? (yes/no): ").strip().lower()

    if confirm != 'yes':
        print("Cancelled.")
        return

    # Ask for batch size
    print("\nHow many files to process?")
    print(f"1. All remaining files ({len(files_to_process)})")
    print("2. First 10 files")
    print("3. First 50 files")
    print("4. First 100 files")
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
        custom = input("Enter number of files: ").strip()
        limit = int(custom) if custom.isdigit() else 10
    else:
        print("Invalid choice, processing first 10 files")
        limit = 10

    files_to_process = files_to_process[:limit]

    print(f"\n📝 Processing {len(files_to_process)} files...")
    print("-" * 80)

    # Track statistics
    successful = 0
    failed = 0
    total_old_chunks = 0
    total_new_chunks = 0

    for i, meta in enumerate(files_to_process, 1):
        title = meta.get('title', meta['id'])[:60]
        date = meta.get('date', 'No date')

        print(f"\n[{i}/{len(files_to_process)}] {date} - {title}...")

        # Double-check it hasn't been processed (in case of race conditions)
        is_new, avg_size, count = check_if_already_processed(meta['id'])
        if is_new:
            print(f"  ⏭️ Skipping - already has new chunking (avg size: {avg_size:.0f})")
            continue

        success, old_count, new_count = process_file_with_new_chunking(meta)

        if success:
            successful += 1
            total_old_chunks += old_count
            total_new_chunks += new_count
        else:
            failed += 1

    # Summary
    print("\n" + "=" * 80)
    print("CONTINUATION PROCESSING COMPLETE")
    print("=" * 80)
    print(f"✅ Successfully processed: {successful} files")
    print(f"❌ Failed: {failed} files")
    print(f"⏭️ Skipped (already processed): {len(new_chunking)} files")

    print(f"\n📊 Chunking Statistics:")
    print(f"  - Total old chunks deleted: {total_old_chunks}")
    print(f"  - Total new chunks created: {total_new_chunks}")

    if total_old_chunks > 0:
        ratio = total_new_chunks / total_old_chunks
        if ratio < 1:
            print(f"  - Reduction: {(1 - ratio) * 100:.1f}% fewer chunks")
        else:
            print(f"  - Increase: {(ratio - 1) * 100:.1f}% more chunks")

    # Final state analysis
    print("\n📈 Final State:")
    old_chunking, new_chunking, no_chunks = analyze_current_state()

    if old_chunking:
        print(f"\n⚠️ Still {len(old_chunking)} files with old chunking remaining.")
        print("   Run this script again to continue processing.")

if __name__ == "__main__":
    main()