import os
import argparse
import sys
from pathlib import Path

from storage_watcher import SupabaseStorageWatcher

def main():
    """
    Main entry point for the Supabase Storage RAG pipeline.
    """
    # Get the directory where the script is located
    script_dir = Path(__file__).resolve().parent
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Supabase Storage RAG Pipeline')
    parser.add_argument('--config', type=str, default=str(script_dir / 'config.json'),
                        help='Path to configuration JSON file')
    parser.add_argument('--interval', type=int, default=60,
                        help='Interval in seconds between checks for changes')
    parser.add_argument('--backfill', action='store_true',
                        help='Run backfill to process all existing files')
    parser.add_argument('--max-files', type=int, default=None,
                        help='Maximum number of files to process during backfill')
    parser.add_argument('--dry-run', action='store_true',
                        help='Run in dry-run mode (no changes will be made)')
    parser.add_argument('--mode', type=str, choices=['watch', 'backfill', 'single'], default='watch',
                        help='Execution mode: watch (continuous), backfill (process all), or single (one-time check)')
    
    args = parser.parse_args()
    
    # Initialize the Supabase Storage watcher
    watcher = SupabaseStorageWatcher(
        config_path=args.config,
        dry_run=args.dry_run
    )
    
    # Execute based on mode
    if args.mode == 'backfill' or args.backfill:
        # Run backfill mode
        watcher.backfill(max_files=args.max_files)
    elif args.mode == 'single':
        # Run single check mode
        print("Running single check for changes...")
        changed_files = watcher.get_changes()
        if changed_files:
            print(f"Found {len(changed_files)} changed files")
            for file_info in changed_files:
                watcher.process_file(file_info)
        else:
            print("No changes detected")
        watcher.save_state()
    else:
        # Default: watch mode
        watcher.watch_for_changes(interval_seconds=args.interval)

if __name__ == "__main__":
    main()