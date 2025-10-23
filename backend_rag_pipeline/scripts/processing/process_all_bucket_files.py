#!/usr/bin/env python3
"""
Script to process all files in Supabase storage buckets through the RAG pipeline.
This will vectorize and chunk all unprocessed files.
"""

import os
import sys
from pathlib import Path
import json
from datetime import datetime

# Add the backend_rag_pipeline to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Supabase_Storage'))

from dotenv import load_dotenv
load_dotenv()

def process_all_bucket_files(bucket_name='meetings', force_reprocess=False):
    """
    Process all files in a Supabase storage bucket.

    Args:
        bucket_name: Name of the bucket to process ('meetings' or 'documents')
        force_reprocess: If True, reprocess even already processed files
    """
    print(f"Processing files from '{bucket_name}' bucket")
    print("=" * 60)

    try:
        # Import storage watcher
        from storage_watcher import SupabaseStorageWatcher

        # Create config for the watcher
        config = {
            "supported_mime_types": [
                "application/pdf",
                "text/plain",
                "text/html",
                "text/csv",
                "text/markdown",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/json",
                "audio/mpeg",
                "audio/wav",
                "application/x-transcript",
                "video/mp4",
                "video/webm"
            ],
            "text_processing": {
                "default_chunk_size": 400,
                "default_chunk_overlap": 0,
                "min_chunk_size": 100,
                "max_chunk_size": 1000
            },
            "rate_limit": {
                "max_files_per_run": 100,  # Process up to 100 files
                "delay_between_files": 0.1
            },
            "meetings_bucket": bucket_name,
            "documents_bucket": bucket_name,
            "backfill": {
                "enabled": True,  # Enable backfill mode
                "batch_size": 50,
                "initial_delay": 1
            }
        }

        # Save config temporarily
        config_path = 'temp_config.json'
        with open(config_path, 'w') as f:
            json.dump(config, f)

        # Initialize watcher
        watcher = SupabaseStorageWatcher(
            config_path=config_path,
            dry_run=False
        )

        # Get list of files from bucket
        files_list = watcher.supabase.storage.from_(bucket_name).list()

        # Filter out directories and already processed files
        files_to_process = []
        for file_info in files_list:
            if file_info.get('metadata'):  # Skip directories
                file_name = file_info.get('name', '')

                # Skip if it's a transcript folder or other directory
                if file_name == 'transcripts':
                    continue

                # Check if already processed (unless force_reprocess is True)
                if not force_reprocess:
                    # Check if file is already in documents table by file_id
                    # Use the bucket/filename combo as the file_id
                    file_id = f"{bucket_name}/{file_name}"
                    existing = watcher.supabase.from_('documents') \
                        .select('id') \
                        .eq('file_id', file_id) \
                        .limit(1) \
                        .execute()

                    if existing.data:
                        print(f"⏭️  Skipping (already processed): {file_name}")
                        continue

                files_to_process.append(file_info)

        # Sort files by updated_at or created_at in DESCENDING order (most recent first)
        def get_file_timestamp(file_info):
            # Get the most recent of updated_at or created_at
            updated_at = file_info.get('updated_at', '')
            created_at = file_info.get('created_at', '')
            # Return the more recent timestamp
            return max(updated_at, created_at) if updated_at or created_at else ''

        files_to_process.sort(key=get_file_timestamp, reverse=True)

        print(f"\nFound {len(files_to_process)} files to process (sorted by most recent first)")
        print("-" * 60)

        if files_to_process and len(files_to_process) > 0:
            first_file = files_to_process[0]
            last_file = files_to_process[-1]
            print(f"First file to process: {first_file.get('name', 'Unknown')}")
            print(f"  Updated: {first_file.get('updated_at', 'N/A')}")
            if len(files_to_process) > 1:
                print(f"Last file to process: {last_file.get('name', 'Unknown')}")
                print(f"  Updated: {last_file.get('updated_at', 'N/A')}")
            print("-" * 60)

        # Process each file
        processed_count = 0
        error_count = 0

        for i, file_info in enumerate(files_to_process, 1):
            file_name = file_info.get('name', '')
            file_size = file_info.get('metadata', {}).get('size', 0)

            print(f"\n[{i}/{len(files_to_process)}] Processing: {file_name}")
            print(f"  Size: {file_size / 1024:.1f} KB")

            try:
                # Create file info dict for the processor
                file_dict = {
                    'name': file_name,
                    'bucket': bucket_name,
                    'metadata': file_info.get('metadata', {}),
                    'created_at': file_info.get('created_at'),
                    'updated_at': file_info.get('updated_at')
                }

                # Process the file
                if watcher.process_file(file_dict):
                    processed_count += 1
                    print(f"  ✅ Successfully processed")
                else:
                    error_count += 1
                    print(f"  ❌ Failed to process")

            except Exception as e:
                error_count += 1
                print(f"  ❌ Error: {e}")
                continue

        # Clean up temp config
        if os.path.exists(config_path):
            os.remove(config_path)

        # Summary
        print("\n" + "=" * 60)
        print("Processing Complete!")
        print(f"✅ Successfully processed: {processed_count} files")
        print(f"❌ Errors: {error_count} files")

        # Update the watcher state
        watcher.save_state()

        return processed_count, error_count

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 0, 0

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Process all files in Supabase storage bucket')
    parser.add_argument('--bucket', default='meetings',
                        help='Bucket name to process (meetings or documents)')
    parser.add_argument('--force', action='store_true',
                        help='Force reprocess even if files are already processed')

    args = parser.parse_args()

    # Process the files
    processed, errors = process_all_bucket_files(
        bucket_name=args.bucket,
        force_reprocess=args.force
    )

    # Exit with appropriate code
    if errors > 0:
        sys.exit(1)
    sys.exit(0)