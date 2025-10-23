import pytest
import os
import tempfile
import json
from unittest.mock import MagicMock

@pytest.fixture
def mock_env():
    """Mock environment variables for testing"""
    original_env = os.environ.copy()
    
    os.environ['SUPABASE_URL'] = 'https://test.supabase.co'
    os.environ['SUPABASE_SERVICE_KEY'] = 'test-service-key'
    os.environ['RAG_PIPELINE_ID'] = 'test-pipeline'
    os.environ['SUPABASE_MEETINGS_BUCKET'] = 'test-meetings'
    os.environ['SUPABASE_DOCUMENTS_BUCKET'] = 'test-documents'
    
    yield
    
    # Restore original environment
    os.environ.clear()
    os.environ.update(original_env)

@pytest.fixture
def temp_config_file():
    """Create temporary config file for testing"""
    config_data = {
        "supported_mime_types": [
            "application/pdf",
            "text/plain",
            "text/csv"
        ],
        "text_processing": {
            "default_chunk_size": 400,
            "default_chunk_overlap": 0
        },
        "rate_limit": {
            "max_files_per_run": 10,
            "delay_between_files": 0.01
        },
        "meetings_bucket": "meetings",
        "documents_bucket": "documents",
        "last_check_time": "1970-01-01T00:00:00.000Z"
    }
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(config_data, f)
        temp_path = f.name
    
    yield temp_path
    
    # Clean up
    if os.path.exists(temp_path):
        os.unlink(temp_path)

@pytest.fixture
def sample_files():
    """Sample file data for testing"""
    return [
        {
            'name': 'meeting_transcript.txt',
            'id': 'file-001',
            'bucket': 'meetings',
            'created_at': '2024-01-01T10:00:00Z',
            'updated_at': '2024-01-01T10:30:00Z',
            'metadata': {
                'meeting_id': 'meet-123',
                'mimetype': 'text/plain'
            }
        },
        {
            'name': 'project_doc.pdf',
            'id': 'file-002',
            'bucket': 'documents',
            'created_at': '2024-01-01T11:00:00Z',
            'updated_at': '2024-01-01T11:15:00Z',
            'metadata': {
                'project_id': 'proj-456',
                'mimetype': 'application/pdf'
            }
        },
        {
            'name': 'data_export.csv',
            'id': 'file-003',
            'bucket': 'documents',
            'created_at': '2024-01-01T12:00:00Z',
            'updated_at': '2024-01-01T12:05:00Z',
            'metadata': {
                'mimetype': 'text/csv'
            }
        }
    ]

@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client for testing"""
    client = MagicMock()
    
    # Mock storage methods
    storage_mock = MagicMock()
    client.storage.from_ = MagicMock(return_value=storage_mock)
    
    # Mock list method
    storage_mock.list = MagicMock(return_value=[])
    
    # Mock download method
    storage_mock.download = MagicMock(return_value=b"Test file content")
    
    # Mock public URL method
    storage_mock.get_public_url = MagicMock(return_value="https://test.supabase.co/storage/v1/object/public/test-bucket/test-file")
    
    return client

@pytest.fixture
def mock_state_manager():
    """Mock state manager for testing"""
    manager = MagicMock()
    
    manager.load_state.return_value = {
        'last_check_time': None,
        'known_files': {}
    }
    
    manager.save_state.return_value = True
    manager.update_last_check_time.return_value = True
    
    return manager