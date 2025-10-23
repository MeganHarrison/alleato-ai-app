from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timezone
import hashlib
import time
import json
import sys
import os
import io
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.text_processor import extract_text_from_file, chunk_text, create_embeddings
from common.db_handler import process_file_for_rag, delete_document_by_file_id
from common.state_manager import get_state_manager, load_state_from_config, save_state_to_config

from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path, override=True)
else:
    load_dotenv()

class SupabaseStorageWatcher:
    def __init__(self, config_path: str = None, dry_run: bool = False):
        """
        Initialize the Supabase Storage watcher.
        
        Args:
            config_path: Path to the configuration file
            dry_run: If True, only log actions without making changes
        """
        self.dry_run = dry_run
        
        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
        
        # Initialize state manager (database-backed state if RAG_PIPELINE_ID is set)
        self.state_manager = get_state_manager('supabase_storage')
        
        # Initialize state variables
        self.known_files = {}  # Store file IDs and their hashes for idempotency
        self.initialized = False  # Flag to track if we've done the initial scan
        
        # Load configuration
        self.config = {}
        if config_path:
            self.config_path = config_path
        else:
            # Default to config.json in the same directory as this script
            self.config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')
        self.load_config()
        
        # Get bucket names from environment or config
        self.meetings_bucket = os.getenv('SUPABASE_MEETINGS_BUCKET', self.config.get('meetings_bucket', 'meetings'))
        self.documents_bucket = os.getenv('SUPABASE_DOCUMENTS_BUCKET', self.config.get('documents_bucket', 'documents'))
        
        print(f"Supabase Storage Watcher initialized. Watching buckets: {self.meetings_bucket}, {self.documents_bucket}")
        if self.dry_run:
            print("DRY RUN MODE: No changes will be made to the database")
    
    def load_config(self) -> None:
        """
        Load configuration from JSON file and state from database (if available).
        
        Configuration (MIME types, processing settings) comes from config.json files.
        Runtime state (last_check_time, known_files) comes from database when RAG_PIPELINE_ID is set.
        """
        # Load configuration from file
        try:
            with open(self.config_path, 'r') as f:
                self.config = json.load(f)
            print(f"Loaded configuration from {self.config_path}")
        except Exception as e:
            print(f"Error loading configuration: {e}")
            self.config = {
                "supported_mime_types": [
                    "application/pdf",
                    "text/plain",
                    "text/html",
                    "text/csv",
                    "text/markdown",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "application/json",
                    "audio/mpeg",  # For transcripts
                    "audio/wav",   # For transcripts
                    "application/x-transcript"  # Custom type for transcript files
                ],
                "text_processing": {
                    "default_chunk_size": 400,
                    "default_chunk_overlap": 0
                },
                "rate_limit": {
                    "max_files_per_run": 100,
                    "delay_between_files": 0.1  # seconds
                },
                "meetings_bucket": "meetings",
                "documents_bucket": "documents",
                "last_check_time": "1970-01-01T00:00:00.000Z"
            }
            print("Using default configuration")
        
        # Load state from database or config file
        if self.state_manager:
            # Use database state management
            state = self.state_manager.load_state()
            last_check = state.get('last_check_time')
            if isinstance(last_check, datetime):
                self.last_check_time = last_check if last_check.tzinfo else last_check.replace(tzinfo=timezone.utc)
            else:
                self.last_check_time = datetime.strptime('1970-01-01T00:00:00.000Z', '%Y-%m-%dT%H:%M:%S.%fZ').replace(tzinfo=timezone.utc)
            self.known_files = state.get('known_files', {})
            print(f"Loaded state from database - last check: {self.last_check_time}, known files: {len(self.known_files)}")
        else:
            # Use file-based state management (backward compatibility)
            state = load_state_from_config(self.config_path)
            last_check = state.get('last_check_time')
            if isinstance(last_check, datetime):
                self.last_check_time = last_check if last_check.tzinfo else last_check.replace(tzinfo=timezone.utc)
            else:
                self.last_check_time = datetime.strptime('1970-01-01T00:00:00.000Z', '%Y-%m-%dT%H:%M:%S.%fZ').replace(tzinfo=timezone.utc)
            self.known_files = {}  # File-based config doesn't store known_files
            print(f"Loaded state from config file - last check: {self.last_check_time}")
        
        # Apply environment variable overrides
        if os.getenv('SUPABASE_SUPPORTED_MIME_TYPES'):
            self.config['supported_mime_types'] = json.loads(os.getenv('SUPABASE_SUPPORTED_MIME_TYPES'))
            print(f"Override MIME types from environment: {self.config['supported_mime_types']}")
    
    def save_last_check_time(self) -> None:
        """
        Save the last check time to database or config file.
        """
        if self.dry_run:
            print(f"[DRY RUN] Would save last check time: {self.last_check_time}")
            return
            
        if self.state_manager:
            # Save to database
            success = self.state_manager.update_last_check_time(self.last_check_time)
            if success:
                print(f"Saved last check time to database: {self.last_check_time}")
            else:
                print(f"Failed to save last check time to database")
        else:
            # Save to config file (backward compatibility)
            success = save_state_to_config(self.config_path, self.last_check_time, self.config)
            if success:
                print(f"Saved last check time to config: {self.last_check_time}")
            else:
                print(f"Failed to save last check time to config")
    
    def save_state(self) -> None:
        """
        Save complete state (last_check_time + known_files) to database or config file.
        """
        if self.dry_run:
            print(f"[DRY RUN] Would save state with {len(self.known_files)} known files")
            return
            
        if self.state_manager:
            # Save complete state to database
            success = self.state_manager.save_state(
                last_check_time=self.last_check_time,
                known_files=self.known_files
            )
            if success:
                print(f"Saved complete state to database: {len(self.known_files)} known files")
            else:
                print(f"Failed to save complete state to database")
        else:
            # Only save last_check_time to config file (known_files not supported in file-based)
            self.save_last_check_time()
    
    def compute_file_hash(self, file_content: bytes) -> str:
        """
        Compute SHA-256 hash of file content for idempotency.
        
        Args:
            file_content: Binary content of the file
            
        Returns:
            SHA-256 hash as hex string
        """
        return hashlib.sha256(file_content).hexdigest()
    
    def is_mime_type_supported(self, mime_type: str) -> bool:
        """
        Check if a MIME type is in the supported list.
        
        Args:
            mime_type: The MIME type to check
            
        Returns:
            True if supported, False otherwise
        """
        supported = mime_type in self.config.get('supported_mime_types', [])
        if not supported:
            print(f"Skipping file with unsupported MIME type: {mime_type}")
        return supported
    
    def list_bucket_files(self, bucket_name: str) -> List[Dict[str, Any]]:
        """
        List all files in a Supabase Storage bucket.
        
        Args:
            bucket_name: Name of the bucket to list
            
        Returns:
            List of file metadata dictionaries
        """
        try:
            # List all files in the bucket
            files = self.supabase.storage.from_(bucket_name).list()
            
            # Flatten nested structure and extract metadata
            result = []
            for item in files:
                if isinstance(item, dict):
                    # It's a file
                    result.append({
                        'name': item.get('name'),
                        'id': item.get('id'),
                        'created_at': item.get('created_at'),
                        'updated_at': item.get('updated_at'),
                        'metadata': item.get('metadata', {}),
                        'bucket': bucket_name
                    })
            
            return result
        except Exception as e:
            print(f"Error listing files in bucket {bucket_name}: {e}")
            return []
    
    def download_file(self, bucket_name: str, file_path: str) -> Optional[bytes]:
        """
        Download a file from Supabase Storage.
        
        Args:
            bucket_name: Name of the bucket
            file_path: Path to the file in the bucket
            
        Returns:
            File content as bytes, or None if download failed
        """
        try:
            response = self.supabase.storage.from_(bucket_name).download(file_path)
            if response:
                return response
            return None
        except Exception as e:
            print(f"Error downloading file {file_path} from bucket {bucket_name}: {e}")
            return None
    
    def get_public_url(self, bucket_name: str, file_path: str) -> str:
        """
        Get the public URL for a file in Supabase Storage.
        
        Args:
            bucket_name: Name of the bucket
            file_path: Path to the file in the bucket
            
        Returns:
            Public URL for the file
        """
        return self.supabase.storage.from_(bucket_name).get_public_url(file_path)
    
    def process_file(self, file_info: Dict[str, Any]) -> bool:
        """
        Process a single file from Supabase Storage.
        
        Args:
            file_info: Dictionary containing file metadata
            
        Returns:
            True if file was processed successfully, False otherwise
        """
        bucket_name = file_info['bucket']
        file_path = file_info['name']
        file_id = f"{bucket_name}/{file_path}"  # Unique identifier
        
        print(f"Processing file: {file_path} from bucket: {bucket_name}")
        
        # Download the file
        file_content = self.download_file(bucket_name, file_path)
        if not file_content:
            print(f"Failed to download file: {file_path}")
            return False
        
        # Compute file hash for idempotency
        file_hash = self.compute_file_hash(file_content)
        
        # Check if we've already processed this exact file content
        if file_id in self.known_files and self.known_files[file_id] == file_hash:
            print(f"Skipping file (no changes): {file_path}")
            return True
        
        # Get MIME type from metadata or infer from extension
        mime_type = file_info.get('metadata', {}).get('mimetype')
        if not mime_type:
            # Infer from file extension
            ext = Path(file_path).suffix.lower()
            mime_map = {
                '.pdf': 'application/pdf',
                '.txt': 'text/plain',
                '.md': 'text/markdown',
                '.csv': 'text/csv',
                '.json': 'application/json',
                '.html': 'text/html',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav'
            }
            mime_type = mime_map.get(ext, 'application/octet-stream')
        
        # Check if MIME type is supported
        if not self.is_mime_type_supported(mime_type):
            return False
        
        # Get public URL for the file
        file_url = self.get_public_url(bucket_name, file_path)
        
        # Extract project or meeting ID from metadata if available
        metadata = file_info.get('metadata', {})
        project_id = metadata.get('project_id')
        meeting_id = metadata.get('meeting_id')
        
        # Build additional metadata for RAG
        rag_metadata = {
            'bucket': bucket_name,
            'file_path': file_path,
            'file_hash': file_hash,
            'source': 'supabase_storage'
        }
        if project_id:
            rag_metadata['project_id'] = project_id
        if meeting_id:
            rag_metadata['meeting_id'] = meeting_id
        
        if self.dry_run:
            print(f"[DRY RUN] Would process file: {file_path}")
            print(f"  - MIME type: {mime_type}")
            print(f"  - File size: {len(file_content)} bytes")
            print(f"  - Hash: {file_hash}")
            print(f"  - Metadata: {rag_metadata}")
        else:
            # Process the file for RAG (extract text, chunk, embed, store)
            try:
                # Delete old version if it exists
                if file_id in self.known_files:
                    print(f"Deleting old version of file: {file_path}")
                    delete_document_by_file_id(file_id)
                
                # Extract text from file content first
                from common.text_processor import extract_text_from_file
                text = extract_text_from_file(file_content, mime_type, file_path)
                if not text:
                    print(f"Failed to extract text from file: {file_path}")
                    return False
                
                # Process the new version
                success = process_file_for_rag(
                    file_content=file_content,
                    text=text,
                    file_id=file_id,
                    file_url=file_url,
                    file_title=file_path,
                    mime_type=mime_type,
                    config=self.config.get('text_processing', {})
                )
                
                if success:
                    # Update known files with new hash
                    self.known_files[file_id] = file_hash
                    print(f"Successfully processed file: {file_path}")
                    return True
                else:
                    print(f"Failed to process file: {file_path}")
                    return False
                    
            except Exception as e:
                print(f"Error processing file {file_path}: {e}")
                return False
        
        # In dry run mode, consider it successful
        return True
    
    def get_changes(self) -> List[Dict[str, Any]]:
        """
        Get all files that have been added or modified since last check.
        
        Returns:
            List of changed files with their metadata
        """
        changed_files = []
        
        # Check both buckets
        for bucket_name in [self.meetings_bucket, self.documents_bucket]:
            print(f"Checking bucket: {bucket_name}")
            
            files = self.list_bucket_files(bucket_name)
            for file_info in files:
                # Check if file was created or updated after last check
                created_at = file_info.get('created_at')
                updated_at = file_info.get('updated_at')
                
                if created_at:
                    created_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    if created_time > self.last_check_time:
                        changed_files.append(file_info)
                        continue
                
                if updated_at:
                    updated_time = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                    if updated_time > self.last_check_time:
                        changed_files.append(file_info)
        
        return changed_files
    
    def backfill(self, max_files: Optional[int] = None) -> None:
        """
        Process all existing files in the storage buckets.
        
        Args:
            max_files: Maximum number of files to process (None for all)
        """
        print("Starting backfill of existing files...")
        
        all_files = []
        
        # Get all files from both buckets
        for bucket_name in [self.meetings_bucket, self.documents_bucket]:
            print(f"Listing files in bucket: {bucket_name}")
            files = self.list_bucket_files(bucket_name)
            all_files.extend(files)
        
        # Apply limit if specified
        if max_files:
            all_files = all_files[:max_files]
        
        print(f"Found {len(all_files)} files to process")
        
        # Process each file
        rate_limit = self.config.get('rate_limit', {})
        delay = rate_limit.get('delay_between_files', 0.1)
        
        for i, file_info in enumerate(all_files):
            print(f"Processing file {i+1}/{len(all_files)}...")
            self.process_file(file_info)
            
            # Rate limiting
            if delay > 0 and i < len(all_files) - 1:
                time.sleep(delay)
        
        # Save state after backfill
        self.save_state()
        print(f"Backfill completed. Processed {len(all_files)} files.")
    
    def watch_for_changes(self, interval_seconds: int = 60) -> None:
        """
        Watch for changes in Supabase Storage buckets and process them.
        
        Args:
            interval_seconds: How often to check for changes (in seconds)
        """
        print(f"Starting to watch for changes (checking every {interval_seconds} seconds)...")
        
        try:
            while True:
                # Check for new/modified files
                changed_files = self.get_changes()
                
                if changed_files:
                    print(f"Found {len(changed_files)} changed files")
                    
                    # Apply rate limits
                    rate_limit = self.config.get('rate_limit', {})
                    max_files = rate_limit.get('max_files_per_run', 100)
                    delay = rate_limit.get('delay_between_files', 0.1)
                    
                    # Process files (up to limit)
                    files_to_process = changed_files[:max_files]
                    for i, file_info in enumerate(files_to_process):
                        self.process_file(file_info)
                        
                        # Rate limiting
                        if delay > 0 and i < len(files_to_process) - 1:
                            time.sleep(delay)
                    
                    if len(changed_files) > max_files:
                        print(f"Rate limit reached. Processed {max_files} files, {len(changed_files) - max_files} remaining for next run.")
                else:
                    print("No changes detected")
                
                # Update last check time
                self.last_check_time = datetime.now(timezone.utc)
                
                # Save state
                self.save_state()
                
                # Wait before next check
                print(f"Waiting {interval_seconds} seconds before next check...")
                time.sleep(interval_seconds)
                
        except KeyboardInterrupt:
            print("\nShutting down watcher...")
            self.save_state()
        except Exception as e:
            print(f"Error in watch loop: {e}")
            self.save_state()
            raise