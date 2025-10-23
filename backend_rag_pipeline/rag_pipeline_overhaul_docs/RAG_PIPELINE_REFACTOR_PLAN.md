# RAG Pipeline Cloud Deployment Refactoring Plan

## Executive Summary

Transform the RAG pipeline from continuous-only execution to support both continuous and scheduled job deployment modes, with full cloud compatibility including serverless platforms.

**Key Goal**: Single `RUN_MODE` environment variable controls execution: `continuous` or `single`

## Current State Analysis

### ✅ Strengths
- Solid modular architecture (Google Drive + Local Files)
- Robust error handling and state management
- Docker containerization ready
- Database integration working well

### ❌ Critical Gaps for Cloud Deployment
1. **Single-run mode incomplete** - scaffolding exists but not implemented in watchers
2. **Google Drive OAuth2 requires interactive flow** - incompatible with serverless/scheduled jobs
3. **File-based configuration** - won't persist in ephemeral containers
4. **Credentials stored as files** - not secure or practical for cloud deployment

## Cloud-Ready Architecture Plan

### 1. **Unified Execution Mode Control**

**Single Environment Variable**:
```bash
RUN_MODE=continuous  # Infinite loop with intervals (default)
RUN_MODE=single      # One check cycle then exit
```

**Implementation**:
- Docker entrypoint reads `RUN_MODE` and routes accordingly
- Both watchers implement unified `check_for_changes()` method
- Continuous mode calls `check_for_changes()` in loop
- Single mode calls once and exits with proper exit codes

### 2. **Google Drive Authentication Overhaul**

**Problem**: Current OAuth2 flow requires interactive browser authentication - impossible in serverless.

**Solution**: Service Account Authentication
```bash
# Replace file-based credentials with environment variable
GOOGLE_DRIVE_CREDENTIALS_JSON='{"type":"service_account","project_id":"..."}' 
```

**Benefits**:
- No interactive authentication required
- Works in any containerized environment
- More secure (no token refresh cycles)
- Easier to manage in cloud secret management

### 3. **Environment-Based Configuration**

**Current Issue**: Configuration depends on `config.json` files that may not persist.

**Solution**: Environment variables for runtime control, config.json for pipeline settings
```bash
# Pipeline Identity & Execution Control (required)
RAG_PIPELINE_ID=my-gdrive-docs-pipeline # Unique identifier for this pipeline instance
RUN_MODE=continuous                      # continuous or single
PIPELINE_TYPE=google_drive               # google_drive or local

# Cloud Deployment Overrides (optional)
RAG_WATCH_FOLDER_ID=1ABC123XYZ789        # Override folder ID from config.json
RAG_WATCH_DIRECTORY=/app/data            # Override directory from config.json

# Google Drive Authentication (Service Account)
GOOGLE_DRIVE_CREDENTIALS_JSON='{"type":"service_account",...}'  # Full service account JSON
```

### 4. **Cloud-Native State Management**

**Challenge**: `known_files` state not persisted between single runs, but configuration should remain in source control.

**Solution**: Clean separation of configuration vs runtime state
- **Configuration**: Stays in `config.json` files (source controlled) + environment variables  
- **Runtime State**: Only `last_check_time` and `known_files` in database
- Each pipeline instance gets unique ID via `RAG_PIPELINE_ID` environment variable

**New Environment Variable**:
```bash
RAG_PIPELINE_ID=my-gdrive-docs-pipeline  # User-defined unique identifier
```

**Database Schema** (Runtime State Only):
```sql
CREATE TABLE rag_pipeline_state (
    pipeline_id TEXT PRIMARY KEY,     -- User-defined pipeline ID (from RAG_PIPELINE_ID)
    pipeline_type TEXT NOT NULL,      -- 'google_drive' or 'local_files'
    last_check_time TIMESTAMP,        -- Last successful check for changes
    known_files JSONB,                -- File metadata for change detection  
    last_run TIMESTAMP,               -- Last successful run timestamp
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Configuration Precedence** (No Database Conflicts):
1. **Environment Variables** (highest priority) - cloud deployment overrides
2. **config.json files** (middle priority) - source controlled defaults  
3. **Code defaults** (lowest priority) - fallback values

**Data Examples**:

**config.json (Source Controlled)**:
```json
{
  "supported_mime_types": ["text/plain", "application/pdf"],
  "export_mime_types": {"application/vnd.google-apps.document": "text/plain"},
  "text_processing": {
    "default_chunk_size": 400,
    "default_chunk_overlap": 50
  },
  "watch_folder_id": null,
  "watch_directory": "./data"
}
```

**Database Runtime State**:
```json
{
  "pipeline_id": "my-gdrive-docs-pipeline",
  "pipeline_type": "google_drive",
  "last_check_time": "2025-01-15T10:30:00Z",
  "known_files": {
    "1XYZ789ABC123": "2025-01-15T10:25:00.123Z",
    "1DEF456GHI789": "2025-01-15T09:15:30.456Z"
  },
  "last_run": "2025-01-15T10:30:00Z"
}
```

**Benefits**:
- **No Deployment Conflicts**: Configuration changes deploy with code
- **Scalability**: JSONB handles thousands of files efficiently  
- **Clean Separation**: Configuration vs runtime state clearly separated
- **Version Control**: All settings tracked in git, only state in database

### 5. **Container Orchestration Ready**

**Exit Codes for Scheduled Jobs**:
- `0`: Success, files processed
- `1`: Error occurred, retry needed
- `2`: Configuration error, don't retry
- `3`: Authentication error, check credentials

**Statistics Output**:
```json
{
  "run_mode": "single",
  "pipeline_type": "google_drive", 
  "files_processed": 3,
  "files_deleted": 1,
  "errors": 0,
  "duration_seconds": 45.2,
  "exit_code": 0
}
```

## Implementation Strategy

### Phase 1: Core Single-Run Implementation (High Priority)
1. **Implement `check_for_changes()` in both watchers**
   - Extract logic from continuous loops
   - Return statistics dictionary
   - Handle initialization and cleanup

2. **Update docker entrypoint**
   - Route based on `RUN_MODE` environment variable
   - Proper exit codes and logging
   - Statistics output for monitoring

### Phase 2: Google Drive Service Account (High Priority)  
1. **Replace OAuth2 with service account authentication**
   - Support `GOOGLE_DRIVE_CREDENTIALS_JSON` environment variable
   - Maintain backward compatibility with file-based credentials
   - Update Google Drive API client initialization

2. **Test service account permissions**
   - Ensure service account has proper Drive API access
   - Test folder-specific permissions if using `RAG_WATCH_FOLDER_ID`

### Phase 3: Environment Configuration (Medium Priority)
1. **Add environment variable parsing**
   - Support all configuration options via env vars
   - Maintain `config.json` as fallback
   - Environment variables take precedence

2. **Database state management**
   - Create `rag_pipeline_state` table for runtime state only
   - Implement state persistence functions for `last_check_time` and `known_files`
   - Graceful fallback to file-based state for legacy compatibility

3. **Update configuration files**
   - Update `backend_rag_pipeline/.env.example` with all new environment variables
   - Include `RAG_PIPELINE_ID` and `GOOGLE_DRIVE_CREDENTIALS_JSON` examples
   - Document configuration precedence (env vars → database → config files)

**Complete .env.example for RAG Pipeline**:
```bash
# Environment
ENVIRONMENT=development

# Pipeline Identity & Execution Control (required)
RAG_PIPELINE_ID=my-gdrive-docs-pipeline
RUN_MODE=continuous
PIPELINE_TYPE=google_drive

# Database Configuration (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Embedding Configuration (required)
EMBEDDING_PROVIDER=openai
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_API_KEY=your_api_key_here
EMBEDDING_MODEL_CHOICE=text-embedding-3-small

# Cloud Deployment Overrides (optional - overrides config.json values)
RAG_WATCH_FOLDER_ID=1ABC123XYZ789
RAG_WATCH_DIRECTORY=/app/Local_Files/data

# Google Drive Authentication (required for Google Drive pipeline)
GOOGLE_DRIVE_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
```

### Phase 4: Cloud Deployment Testing (Medium Priority)
1. **Test scheduled job deployment**
   - Google Cloud Run Jobs
   - Render Cron Jobs  
   - AWS ECS Scheduled Tasks

2. **Verify serverless compatibility**
   - Cold start performance
   - Memory usage optimization
   - Proper cleanup on exit

## Cloud Deployment Examples

### Google Cloud Run Jobs
```yaml
# cloudbuild.yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/$PROJECT_ID/rag-pipeline', './backend_rag_pipeline']
- name: 'gcr.io/cloud-builders/docker' 
  args: ['push', 'gcr.io/$PROJECT_ID/rag-pipeline']

# Schedule job to run every 5 minutes
gcloud run jobs create rag-pipeline \
  --image=gcr.io/$PROJECT_ID/rag-pipeline \
  --set-env-vars="RUN_MODE=single,PIPELINE_TYPE=google_drive" \
  --schedule="*/5 * * * *"
```

### Render Cron Jobs
```yaml
# render.yaml
services:
- type: cron
  name: rag-pipeline
  dockerfilePath: ./backend_rag_pipeline/Dockerfile
  schedule: "*/5 * * * *"  # Every 5 minutes
  envVars:
  - key: RUN_MODE
    value: single
  - key: PIPELINE_TYPE
    value: google_drive
```

## Security Considerations

### Google Drive Service Account Setup
1. Create service account in Google Cloud Console
2. Enable Google Drive API
3. Share target folder with service account email
4. Download service account key JSON
5. Store as environment variable or cloud secret

### Environment Variable Security
- Use cloud-native secret management (Google Secret Manager, AWS Secrets Manager)
- Never commit credentials to code repository
- Rotate service account keys regularly

## Success Metrics

### Technical Metrics
- ✅ Single-run mode completes successfully with exit code 0
- ✅ Service account authentication works without interaction
- ✅ State persists correctly between scheduled runs
- ✅ No file-based dependencies in container

### Deployment Metrics  
- ✅ Successful deployment to 3 cloud platforms (GCP, Render, AWS)
- ✅ Scheduled jobs run reliably without manual intervention
- ✅ Container startup time < 30 seconds for scheduled jobs
- ✅ Memory usage < 512MB for serverless deployments

## Risk Mitigation

### State Corruption
- **Risk**: Database state becomes inconsistent
- **Mitigation**: Add state validation and automatic recovery

### Missing Changes
- **Risk**: Changes occur between scheduled runs
- **Mitigation**: Slight overlap in check windows, robust timestamp handling

### Authentication Failures  
- **Risk**: Service account credentials expire or become invalid
- **Mitigation**: Comprehensive error handling with specific exit codes

### Cold Start Performance
- **Risk**: Slow startup impacts scheduled job efficiency  
- **Mitigation**: Optimize imports, cache initialization data

This plan transforms the RAG pipeline into a truly cloud-native, deployment-flexible system while maintaining all existing functionality.