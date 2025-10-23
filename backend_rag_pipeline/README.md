# RAG Pipeline (Google Drive, Local Files & Supabase Storage)

This RAG (Retrieval Augmented Generation) pipeline processes files from Google Drive, a local directory, or Supabase Storage buckets. It automatically extracts text content, generates embeddings, and stores this information in a Supabase database with PGVector support, enabling semantic search and retrieval for your applications.

The pipeline supports both local development (individual scripts) and production deployment (unified Docker entrypoint with database state management).

## Features

- **Triple Data Source Support:**
    - Monitors Google Drive for file changes (creation, updates, deletion) in a specified folder or entire drive.
    - Monitors a local directory for file changes (creation, updates, deletion).
    - Monitors Supabase Storage buckets (meetings and documents) for new uploads and modifications.
- **Versatile File Processing:** Processes various document types including PDFs, text documents, HTML, CSVs, and more (see Supported File Types).
- **Automated Text Extraction & Chunking:** Extracts text content and intelligently splits it into manageable chunks (default: 400 characters, configurable).
- **Embedding Generation:** Creates embeddings using OpenAI's embedding model (configurable via environment variables).
- **Vector Storage:** Stores content chunks and their embeddings in a Supabase database with PGVector for efficient similarity search.
- **Automatic Sync:** Ensures the database reflects file deletions from the source.
- **Database State Management:** Tracks pipeline state in the database for consistent processing across restarts.
- **Flexible Deployment:** Supports both local development and production deployment modes.

## Requirements

- Docker (recommended) or Python 3.11+
- Supabase account with a PGVector-enabled database
- Tables created from the `sql/` files (including `9-rag_pipeline_state.sql` for state management)
- OpenAI API key (or compatible embedding provider)
- **For Google Drive Pipeline:** Google Drive API credentials (OAuth2 or service account)

## Installation

### Docker Setup (Recommended)

1. **Create a `.env` file** with your configuration:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Environment
   ENVIRONMENT=development
   
   # Pipeline Configuration
   RAG_PIPELINE_TYPE=local  # or google_drive or supabase_storage
   RUN_MODE=continuous      # or single
   RAG_PIPELINE_ID=dev-local-pipeline  # Required for database state management
   
   # Embedding Configuration
   EMBEDDING_BASE_URL=https://api.openai.com/v1
   EMBEDDING_API_KEY=your_openai_api_key
   EMBEDDING_MODEL_CHOICE=text-embedding-3-small
   
   # Database Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   
   # Google Drive Configuration (optional)
   GOOGLE_DRIVE_CREDENTIALS_JSON=  # Service account JSON for production
   RAG_WATCH_FOLDER_ID=           # Specific folder ID to watch
   
   # Local Files Configuration (optional)
   RAG_WATCH_DIRECTORY=           # Override watch directory
   
   # Supabase Storage Configuration (for supabase_storage pipeline)
   SUPABASE_MEETINGS_BUCKET=meetings      # Bucket name for meeting files
   SUPABASE_DOCUMENTS_BUCKET=documents    # Bucket name for document files
   SUPABASE_SUPPORTED_MIME_TYPES=         # JSON array of MIME types (optional)
   ```

2. **Build and run with Docker:**
   ```bash
   # Build the image
   docker build -t rag-pipeline .
   
   # For local files pipeline - create data directory and run
   mkdir -p ./data
   docker run -d \
     --name rag-pipeline \
     -v $(pwd)/data:/app/Local_Files/data \
     --env-file .env \
     rag-pipeline
   
   # Add documents to process
   cp your-documents/* ./data/
   
   # For Google Drive pipeline with OAuth credentials
   docker run -d \
     --name rag-pipeline \
     -v $(pwd)/credentials:/app/Google_Drive/credentials \
     --env-file .env \
     rag-pipeline
   
   # For Supabase Storage pipeline
   docker run -d \
     --name rag-pipeline \
     --env-file .env \
     -e RAG_PIPELINE_TYPE=supabase_storage \
     rag-pipeline
   ```

### Manual Installation (Alternative)

1.  **Clone the repository** (if not already done).

2.  **Navigate to the RAG Pipeline directory:**
    ```bash
    cd 6_Agent_Development/backend_rag_pipeline
    ```

3.  **Create and activate a virtual environment:**
    ```bash
    # Create the virtual environment
    python -m venv venv

    # Activate the virtual environment
    # On Windows:
    venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```

4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Set up environment variables:**
    Use the same environment variable configuration shown in the Docker setup above:
    ```bash
    cp .env.example .env
    # Edit .env with your configuration
    ```

6.  **For Google Drive Pipeline - Google Drive API Setup:**
    - Go to the [Google Cloud Console](https://console.cloud.google.com/).
    - Create a new project or select an existing one.
    - Enable the Google Drive API.
    - Create OAuth 2.0 credentials (Desktop application).
    - Download the credentials JSON file. By default, the pipeline expects this file to be named `credentials.json` and located in the `Google_Drive/` directory (relative to `backend_rag_pipeline`, i.e., `backend_rag_pipeline/Google_Drive/credentials.json`). You can specify a different path using the `--credentials` argument.
    - The first time you run the Google Drive pipeline, it will prompt you to authorize access via a web browser. A `token.json` file will be created in the `Google_Drive/` directory (or the path specified by `--token`) to store your authorization.

## Usage

### With Docker (Recommended)

```bash
# Check if container is running
docker ps | grep rag-pipeline

# View real-time logs
docker logs -f rag-pipeline

# Stop the pipeline
docker stop rag-pipeline

# Start the pipeline again
docker start rag-pipeline

# Restart the pipeline (e.g., after config changes)
docker restart rag-pipeline

# Remove the container
docker rm rag-pipeline

# For local files mode - add documents
cp /path/to/your/documents/* ./data/

# For Google Drive mode - check processing status in logs
docker logs rag-pipeline | tail -20
```

### Manual Usage (Alternative)

Ensure your virtual environment is activated and you are in the `backend_rag_pipeline` directory.

The pipeline can be run in multiple ways depending on your deployment needs:

#### Unified Docker Entrypoint (Recommended for Production)

For Docker deployment and production use, the unified entrypoint provides consistent behavior with database state management:

```bash
# Local files pipeline (continuous mode)
python docker_entrypoint.py --pipeline local --mode continuous --interval 60

# Google Drive pipeline (continuous mode)
python docker_entrypoint.py --pipeline google_drive --mode continuous --interval 60

# Single-run mode (for scheduled/cron jobs)
python docker_entrypoint.py --pipeline local --mode single
python docker_entrypoint.py --pipeline google_drive --mode single

# Custom config paths
python docker_entrypoint.py --pipeline local --mode continuous --config ./custom/config.json
```

**Benefits of the unified entrypoint:**
- Database state management across restarts
- Consistent environment variable handling  
- Production-ready error handling and exit codes
- Support for both continuous and single-run modes
- Works with both local development and Docker deployment

#### Individual Pipeline Scripts (Local Development)

For local development and testing, you can still run the individual pipeline scripts directly. This section focuses on local development setup:

The individual pipelines can be run in two modes: for Google Drive or for Local Files.

#### 1. Google Drive Pipeline (Local Development)

This mode watches a Google Drive folder (or your entire Drive) for changes.

**Command (run from the `backend_rag_pipeline` directory):**
```bash
python Google_Drive/main.py [OPTIONS]
```

**Arguments:**
-   `--credentials FILE_PATH`: Path to Google Drive API credentials file.
    (Default: `Google_Drive/credentials.json`)
-   `--token FILE_PATH`: Path to Google Drive API token file.
    (Default: `Google_Drive/token.json`)
-   `--config FILE_PATH`: Path to the configuration JSON file for the Google Drive pipeline.
    (Default: `Google_Drive/config.json`)
-   `--interval SECONDS`: Interval in seconds between checks for changes.
    (Default: 60)
-   `--folder-id FOLDER_ID`: ID of the specific Google Drive folder to watch (and its subfolders). If not provided, it watches the entire Drive.
    (Default: None)

**Examples (run from the `backend_rag_pipeline` directory):**
```bash
# Watch all of Google Drive with 30-second intervals, using default paths
python Google_Drive/main.py --interval 30

# Watch a specific Google Drive folder
python Google_Drive/main.py --folder-id "your_google_drive_folder_id"

# Use custom paths for credentials and config (paths relative to RAG_Pipeline)
python Google_Drive/main.py --credentials "./custom_creds/gdrive_creds.json" --config "./configs/drive_settings.json"
```

#### 2. Local Files Pipeline (Local Development)

This mode watches a specified local directory for changes.

**Command (run from the `backend_rag_pipeline` directory):**
```bash
python Local_Files/main.py [OPTIONS]
```

**Arguments:**
-   `--config FILE_PATH`: Path to the configuration JSON file for the Local Files pipeline.
    (Default: `Local_Files/config.json`)
-   `--directory DIR_PATH`: Path to the local directory to watch for files. This path can be absolute or relative to the `backend_rag_pipeline` directory.
    (Default: None - **This argument is required**)
-   `--interval SECONDS`: Interval in seconds between checks for changes.
    (Default: 60)

**Examples (run from the `backend_rag_pipeline` directory):**
```bash
# Watch the 'data/my_documents' directory (relative to backend_rag_pipeline, e.g., backend_rag_pipeline/data/my_documents)
python Local_Files/main.py --directory "data/my_documents"

# Watch a specific absolute local directory with a 120-second interval
python Local_Files/main.py --directory "/mnt/shared_data/project_files" --interval 120

# Use a custom config file (path relative to backend_rag_pipeline)
python Local_Files/main.py --directory "./docs_to_process" --config "./configs/local_settings.json"
```

## Configuration Files (`config.json`)

Each pipeline (`Google_Drive` and `Local_Files`) has its own `config.json` file located within its respective subdirectory inside `backend_rag_pipeline` (e.g., `backend_rag_pipeline/Google_Drive/config.json`, `backend_rag_pipeline/Local_Files/config.json`). When running scripts from within `backend_rag_pipeline`, these paths become `Google_Drive/config.json` and `Local_Files/config.json` respectively. These files allow you to customize:
-   `supported_mime_types`: A list of MIME types the pipeline will attempt to process.
-   `text_processing`:
    -   `default_chunk_size`: The target size for text chunks.
    -   `default_chunk_overlap`: The overlap between text chunks.
-   Module-specific settings:
    -   For Google Drive: `export_mime_types` (how Google Workspace files are converted), `watch_folder_id` (can be overridden by environment variables or CLI).
    -   For Local Files: `watch_directory` (can be overridden by environment variables or CLI).

**Note**: When using the unified Docker entrypoint with `RAG_PIPELINE_ID` set, pipeline state (`last_check_time`, `known_files`) is stored in the database (`rag_pipeline_state` table) rather than config files. This enables proper state management across container restarts and scheduled runs.

## Database Schema

### Documents Table
The pipeline uses a `documents` table in your Supabase database with the following (expected) columns:
-   `id` (UUID PRIMARY KEY or SERIAL PRIMARY KEY): Unique identifier for the chunk.
-   `content` (TEXT): The text content of the processed chunk.
-   `metadata` (JSONB): Contains information about the source file, such as `file_id` (for Google Drive), `file_path` (for local files), `file_name`, `source_type` ('google_drive' or 'local_file'), etc. *(Verify exact fields based on `common/db_handler.py`)*
-   `embedding` (VECTOR): The OpenAI embedding vector for the content chunk.

### RAG Pipeline State Table
The pipeline also uses a `rag_pipeline_state` table for managing pipeline state across runs:
-   `pipeline_id` (TEXT PRIMARY KEY): User-defined pipeline identifier (from `RAG_PIPELINE_ID` environment variable).
-   `pipeline_type` (TEXT): 'google_drive' or 'local_files'.
-   `last_check_time` (TIMESTAMP): Last successful check for changes.
-   `known_files` (JSONB): File metadata for change detection (file_id -> timestamp mapping).
-   `last_run` (TIMESTAMP): Last successful run timestamp.
-   `created_at`, `updated_at` (TIMESTAMP): Record timestamps.

**Note**: Ensure you've run the `9-rag_pipeline_state.sql` script to create this table and enable Row Level Security.

## How It Works

1.  **Initialization & Authentication:**
    -   **Google Drive:** Authenticates with the Google Drive API using credentials.json (local development) or service account JSON (production via `GOOGLE_DRIVE_CREDENTIALS_JSON`).
    -   **Local Files:** Sets up a watcher for the specified local directory.
    -   Both connect to the Supabase database using environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`).
    -   **State Management:** When `RAG_PIPELINE_ID` is set, loads previous state from the `rag_pipeline_state` table for consistent processing across restarts.
2.  **Periodic Monitoring:** The pipeline periodically checks the source (Google Drive or local directory) for new, updated, or deleted files based on the `interval` setting.
3.  **File Processing (for new/updated files):**
    -   The file is downloaded (from Google Drive) or read (from the local disk).
    -   Text content is extracted. For Google Workspace files, they are typically exported to a plain text or CSV format first, as defined in `Google_Drive/config.json`.
    -   The extracted text is split into smaller, manageable chunks based on the `text_processing` settings in the respective `config.json` file.
    -   OpenAI embeddings are generated for each text chunk using the model specified by `LLM_API_KEY` (and optionally `EMBEDDING_MODEL_NAME`).
    -   Any existing records for the file (if it was updated) are removed from the Supabase `documents` table to prevent duplicates.
    -   The new text chunks, their metadata, and embeddings are inserted into the `documents` table.
4.  **Deletion Handling (for deleted files):**
    -   When a file is detected as deleted from the source, all corresponding records (chunks and embeddings) for that file are removed from the Supabase `documents` table.

## Supported File Types

The pipeline supports a variety of file types. The exact list can be found and configured in the `supported_mime_types` section of the respective `config.json` files (e.g., `Google_Drive/config.json`, `Local_Files/config.json` when viewed from within the `backend_rag_pipeline` directory).

Commonly supported types include:
-   PDF (`application/pdf`)
-   Plain Text (`text/plain`)
-   HTML (`text/html`)
-   CSV (`text/csv`)
-   Microsoft Excel (`application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
-   Microsoft Word (`application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) (More relevant for Local Files pipeline)
-   Google Docs, Sheets, Presentations (for Google Drive, converted as per `export_mime_types`)
-   Images (`image/png`, `image/jpg`, `image/jpeg`, `image/svg`) 
    *Note: Text extraction from images (OCR) depends on the capabilities of the underlying `common/text_processor.py`. Review its implementation for details on image handling.*
