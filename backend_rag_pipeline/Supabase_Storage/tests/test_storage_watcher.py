import unittest
from unittest.mock import patch, MagicMock, Mock, call
import json
import hashlib
from datetime import datetime, timezone, timedelta
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from storage_watcher import SupabaseStorageWatcher

class TestSupabaseStorageWatcher(unittest.TestCase):
    """Unit tests for SupabaseStorageWatcher"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Mock environment variables
        os.environ['SUPABASE_URL'] = 'https://test.supabase.co'
        os.environ['SUPABASE_SERVICE_KEY'] = 'test-key-12345'
        os.environ['RAG_PIPELINE_ID'] = 'test-pipeline'
    
    def tearDown(self):
        """Clean up after tests"""
        # Clean up environment variables
        for key in ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'RAG_PIPELINE_ID']:
            if key in os.environ:
                del os.environ[key]
    
    @patch('storage_watcher.create_client')
    @patch('storage_watcher.get_state_manager')
    def test_initialization(self, mock_state_manager, mock_create_client):
        """Test SupabaseStorageWatcher initialization"""
        mock_state_manager.return_value = MagicMock()
        mock_state_manager.return_value.load_state.return_value = {
            'last_check_time': datetime(2024, 1, 1, tzinfo=timezone.utc),
            'known_files': {}
        }
        
        watcher = SupabaseStorageWatcher(dry_run=True)
        
        self.assertTrue(watcher.dry_run)
        self.assertEqual(watcher.meetings_bucket, 'meetings')
        self.assertEqual(watcher.documents_bucket, 'documents')
        mock_create_client.assert_called_once_with('https://test.supabase.co', 'test-key-12345')
    
    def test_compute_file_hash(self):
        """Test file hash computation for idempotency"""
        with patch('storage_watcher.create_client'):
            with patch('storage_watcher.get_state_manager'):
                watcher = SupabaseStorageWatcher()
                
                # Test with sample content
                content1 = b"Hello, World!"
                content2 = b"Hello, World!"
                content3 = b"Different content"
                
                hash1 = watcher.compute_file_hash(content1)
                hash2 = watcher.compute_file_hash(content2)
                hash3 = watcher.compute_file_hash(content3)
                
                # Same content should produce same hash
                self.assertEqual(hash1, hash2)
                # Different content should produce different hash
                self.assertNotEqual(hash1, hash3)
                
                # Should be valid SHA-256 hash (64 hex characters)
                self.assertEqual(len(hash1), 64)
                self.assertTrue(all(c in '0123456789abcdef' for c in hash1))
    
    def test_is_mime_type_supported(self):
        """Test MIME type filtering"""
        with patch('storage_watcher.create_client'):
            with patch('storage_watcher.get_state_manager'):
                watcher = SupabaseStorageWatcher()
                
                # Set up test configuration
                watcher.config = {
                    'supported_mime_types': [
                        'application/pdf',
                        'text/plain',
                        'text/csv',
                        'audio/mpeg'
                    ]
                }
                
                # Test supported types
                self.assertTrue(watcher.is_mime_type_supported('application/pdf'))
                self.assertTrue(watcher.is_mime_type_supported('text/plain'))
                self.assertTrue(watcher.is_mime_type_supported('audio/mpeg'))
                
                # Test unsupported types
                self.assertFalse(watcher.is_mime_type_supported('image/png'))
                self.assertFalse(watcher.is_mime_type_supported('video/mp4'))
                self.assertFalse(watcher.is_mime_type_supported('application/octet-stream'))
    
    @patch('storage_watcher.create_client')
    @patch('storage_watcher.get_state_manager')
    def test_list_bucket_files(self, mock_state_manager, mock_create_client):
        """Test listing files from Supabase Storage bucket"""
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client
        
        # Mock storage response
        mock_client.storage.from_.return_value.list.return_value = [
            {
                'name': 'document1.pdf',
                'id': 'file-123',
                'created_at': '2024-01-01T10:00:00Z',
                'updated_at': '2024-01-01T11:00:00Z',
                'metadata': {'project_id': 'proj-1'}
            },
            {
                'name': 'transcript.txt',
                'id': 'file-456',
                'created_at': '2024-01-01T12:00:00Z',
                'updated_at': '2024-01-01T13:00:00Z',
                'metadata': {'meeting_id': 'meet-1'}
            }
        ]
        
        watcher = SupabaseStorageWatcher()
        files = watcher.list_bucket_files('documents')
        
        self.assertEqual(len(files), 2)
        self.assertEqual(files[0]['name'], 'document1.pdf')
        self.assertEqual(files[0]['bucket'], 'documents')
        self.assertEqual(files[1]['name'], 'transcript.txt')
        self.assertEqual(files[1]['metadata']['meeting_id'], 'meet-1')
    
    @patch('storage_watcher.create_client')
    @patch('storage_watcher.get_state_manager')
    @patch('storage_watcher.process_file_for_rag')
    @patch('storage_watcher.delete_document_by_file_id')
    def test_process_file_idempotency(self, mock_delete, mock_process_rag, 
                                      mock_state_manager, mock_create_client):
        """Test that files with same hash are not reprocessed"""
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client
        
        # Mock download response
        file_content = b"Test document content"
        mock_client.storage.from_.return_value.download.return_value = file_content
        
        watcher = SupabaseStorageWatcher()
        
        # Calculate expected hash
        expected_hash = hashlib.sha256(file_content).hexdigest()
        
        # Set up known files with existing hash
        watcher.known_files = {
            'documents/test.pdf': expected_hash
        }
        
        file_info = {
            'bucket': 'documents',
            'name': 'test.pdf',
            'metadata': {'mimetype': 'application/pdf'}
        }
        
        # Process file - should skip due to same hash
        result = watcher.process_file(file_info)
        
        self.assertTrue(result)
        mock_process_rag.assert_not_called()
        mock_delete.assert_not_called()
    
    @patch('storage_watcher.create_client')
    @patch('storage_watcher.get_state_manager')
    @patch('storage_watcher.process_file_for_rag')
    @patch('storage_watcher.delete_document_by_file_id')
    def test_process_file_update(self, mock_delete, mock_process_rag,
                                 mock_state_manager, mock_create_client):
        """Test that updated files trigger re-processing"""
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client
        
        # Mock download response with new content
        new_content = b"Updated document content"
        mock_client.storage.from_.return_value.download.return_value = new_content
        mock_client.storage.from_.return_value.get_public_url.return_value = 'https://test.url/file.pdf'
        
        mock_process_rag.return_value = True
        
        watcher = SupabaseStorageWatcher()
        
        # Set up known files with old hash
        watcher.known_files = {
            'documents/test.pdf': 'old-hash-12345'
        }
        
        watcher.config = {
            'supported_mime_types': ['application/pdf'],
            'text_processing': {}
        }
        
        file_info = {
            'bucket': 'documents',
            'name': 'test.pdf',
            'metadata': {'mimetype': 'application/pdf'}
        }
        
        # Process updated file
        result = watcher.process_file(file_info)
        
        self.assertTrue(result)
        # Should delete old version first
        mock_delete.assert_called_once_with('documents/test.pdf')
        # Should process new version
        mock_process_rag.assert_called_once()
        
        # Check that hash was updated
        new_hash = hashlib.sha256(new_content).hexdigest()
        self.assertEqual(watcher.known_files['documents/test.pdf'], new_hash)
    
    @patch('storage_watcher.create_client')
    @patch('storage_watcher.get_state_manager')
    def test_get_changes(self, mock_state_manager, mock_create_client):
        """Test getting changed files since last check"""
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client
        
        # Set up last check time
        last_check = datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc)
        
        # Mock bucket listings
        meetings_files = [
            {
                'name': 'meeting1.txt',
                'created_at': '2024-01-01T11:00:00Z',  # After last check
                'updated_at': '2024-01-01T11:30:00Z'
            },
            {
                'name': 'old_meeting.txt',
                'created_at': '2024-01-01T08:00:00Z',  # Before last check
                'updated_at': '2024-01-01T09:00:00Z'   # Before last check
            }
        ]
        
        documents_files = [
            {
                'name': 'document1.pdf',
                'created_at': '2024-01-01T09:00:00Z',  # Before last check
                'updated_at': '2024-01-01T12:00:00Z'   # After last check
            }
        ]
        
        watcher = SupabaseStorageWatcher()
        watcher.last_check_time = last_check
        
        # Mock list_bucket_files method
        def mock_list_bucket(bucket_name):
            if bucket_name == 'meetings':
                return meetings_files
            elif bucket_name == 'documents':
                return documents_files
            return []
        
        watcher.list_bucket_files = mock_list_bucket
        
        # Get changes
        changes = watcher.get_changes()
        
        # Should return 2 files (meeting1.txt and document1.pdf)
        self.assertEqual(len(changes), 2)
        file_names = [f['name'] for f in changes]
        self.assertIn('meeting1.txt', file_names)
        self.assertIn('document1.pdf', file_names)
        self.assertNotIn('old_meeting.txt', file_names)
    
    @patch('storage_watcher.create_client')
    @patch('storage_watcher.get_state_manager')
    def test_backfill(self, mock_state_manager, mock_create_client):
        """Test backfill functionality"""
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client
        
        watcher = SupabaseStorageWatcher()
        
        # Mock list_bucket_files
        test_files = [
            {'name': 'file1.pdf', 'bucket': 'documents'},
            {'name': 'file2.txt', 'bucket': 'meetings'},
            {'name': 'file3.csv', 'bucket': 'documents'}
        ]
        
        def mock_list_bucket(bucket_name):
            return [f for f in test_files if f.get('bucket') == bucket_name]
        
        watcher.list_bucket_files = mock_list_bucket
        
        # Mock process_file
        watcher.process_file = MagicMock(return_value=True)
        watcher.save_state = MagicMock()
        
        # Run backfill with limit
        watcher.backfill(max_files=2)
        
        # Should process only 2 files
        self.assertEqual(watcher.process_file.call_count, 2)
        watcher.save_state.assert_called_once()
    
    @patch('storage_watcher.create_client')
    @patch('storage_watcher.get_state_manager')
    def test_dry_run_mode(self, mock_state_manager, mock_create_client):
        """Test dry-run mode doesn't make changes"""
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client
        
        # Create watcher in dry-run mode
        watcher = SupabaseStorageWatcher(dry_run=True)
        
        # Mock download
        mock_client.storage.from_.return_value.download.return_value = b"Test content"
        mock_client.storage.from_.return_value.get_public_url.return_value = 'https://test.url'
        
        watcher.config = {
            'supported_mime_types': ['application/pdf'],
            'text_processing': {}
        }
        
        file_info = {
            'bucket': 'documents',
            'name': 'test.pdf',
            'metadata': {'mimetype': 'application/pdf'}
        }
        
        # Mock the RAG processing function
        with patch('storage_watcher.process_file_for_rag') as mock_process_rag:
            with patch('storage_watcher.delete_document_by_file_id') as mock_delete:
                result = watcher.process_file(file_info)
                
                # Should return True but not call processing functions
                self.assertTrue(result)
                mock_process_rag.assert_not_called()
                mock_delete.assert_not_called()
    
    @patch('storage_watcher.create_client')
    @patch('storage_watcher.get_state_manager')
    def test_metadata_extraction(self, mock_state_manager, mock_create_client):
        """Test extraction of project/meeting metadata"""
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client
        
        mock_client.storage.from_.return_value.download.return_value = b"Test content"
        mock_client.storage.from_.return_value.get_public_url.return_value = 'https://test.url'
        
        watcher = SupabaseStorageWatcher()
        watcher.config = {
            'supported_mime_types': ['application/pdf'],
            'text_processing': {}
        }
        
        file_info = {
            'bucket': 'documents',
            'name': 'test.pdf',
            'metadata': {
                'mimetype': 'application/pdf',
                'project_id': 'proj-123',
                'meeting_id': 'meet-456'
            }
        }
        
        with patch('storage_watcher.process_file_for_rag') as mock_process_rag:
            mock_process_rag.return_value = True
            watcher.process_file(file_info)
            
            # Check that metadata was passed correctly
            call_args = mock_process_rag.call_args
            additional_metadata = call_args.kwargs['additional_metadata']
            
            self.assertEqual(additional_metadata['project_id'], 'proj-123')
            self.assertEqual(additional_metadata['meeting_id'], 'meet-456')
            self.assertEqual(additional_metadata['bucket'], 'documents')
            self.assertEqual(additional_metadata['source'], 'supabase_storage')


class TestIntegrationSupabaseStorage(unittest.TestCase):
    """Integration tests for Supabase Storage RAG pipeline"""
    
    @patch('storage_watcher.create_client')
    @patch('storage_watcher.get_state_manager')
    @patch('storage_watcher.extract_text_from_file')
    @patch('storage_watcher.chunk_text')
    @patch('storage_watcher.create_embeddings')
    @patch('storage_watcher.process_file_for_rag')
    def test_end_to_end_file_processing(self, mock_process_rag, mock_embeddings,
                                        mock_chunk, mock_extract, 
                                        mock_state_manager, mock_create_client):
        """Test complete file processing flow"""
        # Setup mocks
        mock_client = MagicMock()
        mock_create_client.return_value = mock_client
        
        # Mock file content
        pdf_content = b"%PDF-1.4 Sample PDF content"
        mock_client.storage.from_.return_value.download.return_value = pdf_content
        mock_client.storage.from_.return_value.get_public_url.return_value = 'https://test.url/doc.pdf'
        
        # Mock text extraction and processing
        mock_extract.return_value = "Extracted text from PDF"
        mock_chunk.return_value = ["Chunk 1", "Chunk 2", "Chunk 3"]
        mock_embeddings.return_value = [[0.1]*1536, [0.2]*1536, [0.3]*1536]
        mock_process_rag.return_value = True
        
        # Create watcher
        watcher = SupabaseStorageWatcher()
        watcher.config = {
            'supported_mime_types': ['application/pdf'],
            'text_processing': {
                'default_chunk_size': 400,
                'default_chunk_overlap': 0
            }
        }
        
        # Process a PDF file
        file_info = {
            'bucket': 'documents',
            'name': 'sample.pdf',
            'metadata': {
                'mimetype': 'application/pdf',
                'project_id': 'test-project'
            }
        }
        
        result = watcher.process_file(file_info)
        
        # Verify successful processing
        self.assertTrue(result)
        mock_process_rag.assert_called_once()
        
        # Verify file was added to known files
        file_id = 'documents/sample.pdf'
        self.assertIn(file_id, watcher.known_files)
        
        # Verify hash was computed correctly
        expected_hash = hashlib.sha256(pdf_content).hexdigest()
        self.assertEqual(watcher.known_files[file_id], expected_hash)

if __name__ == '__main__':
    unittest.main()