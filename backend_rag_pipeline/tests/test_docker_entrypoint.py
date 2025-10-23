import pytest
import sys
import os
import json
from unittest.mock import patch, MagicMock, call
from pathlib import Path

# Mock environment variables before importing modules that use them
with patch.dict(os.environ, {
    'SUPABASE_URL': 'https://test-supabase-url.com',
    'SUPABASE_SERVICE_KEY': 'test-supabase-key',
    'EMBEDDING_PROVIDER': 'openai',
    'EMBEDDING_BASE_URL': 'https://api.openai.com/v1',
    'EMBEDDING_API_KEY': 'test-embedding-key',
    'EMBEDDING_MODEL_CHOICE': 'text-embedding-3-small',
    'LLM_PROVIDER': 'openai',
    'LLM_BASE_URL': 'https://api.openai.com/v1',
    'LLM_API_KEY': 'test-llm-key',
    'VISION_LLM_CHOICE': 'gpt-4-vision-preview'
}):
    # Mock the Supabase client
    with patch('supabase.create_client') as mock_create_client:
        mock_supabase = MagicMock()
        mock_create_client.return_value = mock_supabase
        
        # Add the parent directory to sys.path to import the modules
        sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
        from docker_entrypoint import run_single_check, main

class TestDockerEntrypoint:
    
    @patch('builtins.__import__')
    @patch('os.chdir')
    def test_run_single_check_local_success(self, mock_chdir, mock_import):
        """Test successful single check for local pipeline"""
        # Setup mock watcher and LocalFileWatcher class
        mock_watcher_instance = MagicMock()
        mock_local_watcher_class = MagicMock()
        mock_local_watcher_class.return_value = mock_watcher_instance
        
        # Mock file_watcher module
        mock_file_watcher_module = MagicMock()
        mock_file_watcher_module.LocalFileWatcher = mock_local_watcher_class
        
        def import_side_effect(name, *args, **kwargs):
            if name == 'file_watcher':
                return mock_file_watcher_module
            return __import__(name, *args, **kwargs)
        
        mock_import.side_effect = import_side_effect
        
        # Mock check_for_changes to return success stats
        mock_stats = {
            'files_processed': 3,
            'files_deleted': 1,
            'errors': 0,
            'duration': 1.5,
            'initialized': True
        }
        mock_watcher_instance.check_for_changes.return_value = mock_stats
        
        # Call the function
        result = run_single_check('local', directory='/test/dir', config='test_config.json')
        
        # Verify the result
        assert result['pipeline_type'] == 'local'
        assert result['run_mode'] == 'single'
        assert result['files_processed'] == 3
        assert result['files_deleted'] == 1
        assert result['errors'] == 0
        assert 'total_duration' in result
        
        # Verify watcher was initialized correctly
        mock_local_watcher_class.assert_called_once_with(
            watch_directory='/test/dir',
            config_path='test_config.json'
        )
        mock_watcher_instance.check_for_changes.assert_called_once()

    @patch('builtins.__import__')
    @patch('os.chdir')
    def test_run_single_check_google_drive_success(self, mock_chdir, mock_import):
        """Test successful single check for Google Drive pipeline"""
        # Setup mock watcher and GoogleDriveWatcher class
        mock_watcher_instance = MagicMock()
        mock_drive_watcher_class = MagicMock()
        mock_drive_watcher_class.return_value = mock_watcher_instance
        
        # Mock drive_watcher module
        mock_drive_watcher_module = MagicMock()
        mock_drive_watcher_module.GoogleDriveWatcher = mock_drive_watcher_class
        
        def import_side_effect(name, *args, **kwargs):
            if name == 'drive_watcher':
                return mock_drive_watcher_module
            return __import__(name, *args, **kwargs)
        
        mock_import.side_effect = import_side_effect
        
        # Mock check_for_changes to return success stats
        mock_stats = {
            'files_processed': 2,
            'files_deleted': 0,
            'errors': 0,
            'duration': 2.0,
            'initialized': False
        }
        mock_watcher_instance.check_for_changes.return_value = mock_stats
        
        # Call the function
        result = run_single_check('google_drive', config='gdrive_config.json')
        
        # Verify the result
        assert result['pipeline_type'] == 'google_drive'
        assert result['run_mode'] == 'single'
        assert result['files_processed'] == 2
        assert result['files_deleted'] == 0
        assert result['errors'] == 0
        
        # Verify watcher was initialized correctly
        mock_drive_watcher_class.assert_called_once_with(
            config_path='gdrive_config.json'
        )
        mock_watcher_instance.check_for_changes.assert_called_once()

    @patch('builtins.__import__')
    @patch('os.chdir')
    def test_run_single_check_with_error(self, mock_chdir, mock_import):
        """Test single check with error handling"""
        # Setup mock to raise an exception on import
        def import_side_effect(name, *args, **kwargs):
            if name == 'file_watcher':
                raise Exception("Initialization failed")
            return __import__(name, *args, **kwargs)
        
        mock_import.side_effect = import_side_effect
        
        # Call the function
        result = run_single_check('local', directory='/test/dir')
        
        # Verify error handling
        assert result['pipeline_type'] == 'local'
        assert result['run_mode'] == 'single'
        assert result['files_processed'] == 0
        assert result['files_deleted'] == 0
        assert result['errors'] == 1
        assert result['error_message'] == "Initialization failed"
        assert 'total_duration' in result

    def test_run_single_check_invalid_pipeline(self):
        """Test single check with invalid pipeline type"""
        # Call with invalid pipeline type
        result = run_single_check('invalid_pipeline')
        
        # Verify error handling
        assert result['pipeline_type'] == 'invalid_pipeline'
        assert result['errors'] == 1
        assert 'Unknown pipeline type' in result['error_message']

    @patch('docker_entrypoint.run_single_check')
    @patch('sys.exit')
    @patch('sys.argv', ['docker_entrypoint.py', '--pipeline', 'local', '--mode', 'single'])
    def test_main_single_run_success(self, mock_exit, mock_run_single_check):
        """Test main function with successful single run"""
        # Setup mock to return success stats
        mock_run_single_check.return_value = {
            'pipeline_type': 'local',
            'run_mode': 'single',
            'files_processed': 2,
            'files_deleted': 0,
            'errors': 0,
            'duration': 1.0
        }
        
        # Call main
        main()
        
        # Verify single check was called correctly
        mock_run_single_check.assert_called_once_with(
            'local',
            directory=None,
            config='config.json'  # Default config is now set when none provided
        )
        
        # Verify successful exit
        mock_exit.assert_called_once_with(0)

    @patch('docker_entrypoint.run_single_check')
    @patch('sys.exit')
    @patch('sys.argv', ['docker_entrypoint.py', '--pipeline', 'google_drive', '--mode', 'single'])
    def test_main_single_run_authentication_error(self, mock_exit, mock_run_single_check):
        """Test main function with authentication error"""
        # Setup mock to return authentication error
        mock_run_single_check.return_value = {
            'pipeline_type': 'google_drive',
            'run_mode': 'single',
            'files_processed': 0,
            'files_deleted': 0,
            'errors': 1,
            'error_message': 'Authentication failed for credentials'
        }
        
        # Call main
        main()
        
        # Verify authentication error exit code
        mock_exit.assert_called_once_with(3)

    @patch('docker_entrypoint.run_single_check')
    @patch('sys.exit')
    @patch('sys.argv', ['docker_entrypoint.py', '--pipeline', 'local', '--mode', 'single'])
    def test_main_single_run_config_error(self, mock_exit, mock_run_single_check):
        """Test main function with configuration error"""
        # Setup mock to return config error
        mock_run_single_check.return_value = {
            'pipeline_type': 'local',
            'run_mode': 'single',
            'files_processed': 0,
            'files_deleted': 0,
            'errors': 1,
            'error_message': 'Invalid config file format'
        }
        
        # Call main
        main()
        
        # Verify config error exit code
        mock_exit.assert_called_once_with(2)

    @patch('docker_entrypoint.run_single_check')
    @patch('sys.exit')
    @patch('sys.argv', ['docker_entrypoint.py', '--pipeline', 'local', '--mode', 'single'])
    def test_main_single_run_runtime_error(self, mock_exit, mock_run_single_check):
        """Test main function with runtime error"""
        # Setup mock to return runtime error
        mock_run_single_check.return_value = {
            'pipeline_type': 'local',
            'run_mode': 'single',
            'files_processed': 1,
            'files_deleted': 0,
            'errors': 1,
            'error_message': 'Database connection failed'
        }
        
        # Call main
        main()
        
        # Verify runtime error exit code (retry recommended)
        mock_exit.assert_called_once_with(1)

    @patch('docker_entrypoint.run_single_check')
    @patch('sys.exit')
    @patch('sys.argv', [
        'docker_entrypoint.py', 
        '--pipeline', 'local', 
        '--mode', 'single',
        '--directory', '/custom/dir',
        '--config', 'custom_config.json'
    ])
    def test_main_with_custom_arguments(self, mock_exit, mock_run_single_check):
        """Test main function with custom arguments"""
        # Setup mock to return success
        mock_run_single_check.return_value = {
            'errors': 0,
            'files_processed': 1
        }
        
        # Call main
        main()
        
        # Verify custom arguments were passed
        mock_run_single_check.assert_called_once_with(
            'local',
            directory='/custom/dir',
            config='custom_config.json'
        )

    @pytest.mark.parametrize("exit_code,error_type", [
        (0, "no_error"),
        (1, "runtime_error"),
        (2, "config_error"),
        (3, "auth_error")
    ])
    @patch('docker_entrypoint.run_single_check')
    @patch('sys.exit')
    @patch('sys.argv', ['docker_entrypoint.py', '--pipeline', 'local', '--mode', 'single'])
    def test_exit_codes(self, mock_exit, mock_run_single_check, exit_code, error_type):
        """Test all exit codes are handled correctly"""
        if error_type == "no_error":
            mock_stats = {'errors': 0}
        elif error_type == "runtime_error":
            mock_stats = {'errors': 1, 'error_message': 'Runtime error'}
        elif error_type == "config_error":
            mock_stats = {'errors': 1, 'error_message': 'Config error'}
        elif error_type == "auth_error":
            mock_stats = {'errors': 1, 'error_message': 'Authentication failed'}
        
        mock_run_single_check.return_value = mock_stats
        
        # Call main
        main()
        
        # Verify correct exit code
        mock_exit.assert_called_once_with(exit_code)