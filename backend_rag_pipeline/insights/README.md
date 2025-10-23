# Insights Module for RAG Pipeline

This module provides AI-driven insights generation from meeting transcripts and project documents, automatically extracting actionable intelligence for project management.

## Architecture

The insights functionality is properly integrated into the RAG pipeline with the following components:

### Core Components

1. **`insights_service.py`** - Core insights generation service with LLM integration
2. **`insights_processor.py`** - Document processing and batch operations
3. **`insights_triggers.py`** - Trigger management for various processing modes

### Integration Points

- **Automatic Processing**: Insights are automatically generated when documents are processed in the RAG pipeline
- **Manual Triggers**: API endpoints and scripts for manual processing
- **Frontend UI**: Admin dashboard with insights management interface

## Features

### Insight Types
- Action Items
- Decisions
- Risks  
- Milestones
- Blockers
- Dependencies
- Budget Updates
- Timeline Changes
- Stakeholder Feedback
- Technical Issues
- Opportunities
- Concerns

### Processing Modes

1. **Automatic**: Triggered when documents are processed by the RAG pipeline
2. **Manual API**: RESTful endpoints for manual triggering
3. **Webhook**: External system integration
4. **Script**: Command-line interface for batch processing

## Setup

### Environment Variables

Add to your `.env` file:

```env
# Required for insights functionality
OPENAI_API_KEY=your_openai_api_key
AUTO_PROCESS_INSIGHTS=true
INSIGHTS_BATCH_SIZE=5
INSIGHTS_API_PORT=8002
INSIGHTS_WEBHOOK_SECRET=your_webhook_secret
```

### Dependencies

Install additional requirements:

```bash
pip install -r requirements-insights.txt
```

### Database Setup

Ensure your Supabase database has the `insights` table. The table should be created by the main project's SQL scripts.

## Usage

### 1. Automatic Processing

Insights are automatically generated when documents are processed in the RAG pipeline if:
- `AUTO_PROCESS_INSIGHTS=true` in environment
- Document is identified as a meeting transcript
- Document content is sufficient (>100 characters)
- File type is supported (txt, md, docx, pdf, json)

### 2. Manual API Triggers

Start the insights API server:

```bash
cd backend_rag_pipeline
python insights_api.py
```

API endpoints:

- `GET /insights/status` - Get processing status
- `POST /insights/trigger` - Trigger manual processing
- `POST /insights/webhook` - Webhook endpoint
- `GET /insights/recent` - Get recent insights
- `POST /insights/process-pending` - Process pending queue

### 3. Command Line Script

```bash
# Process all pending documents
python manual_insights.py --process-pending

# Process specific document
python manual_insights.py --document-id <doc_id> --user-id <user_id>

# Process multiple documents
python manual_insights.py --batch --document-ids <id1> <id2> <id3> --user-id <user_id>

# Check status
python manual_insights.py --status

# Enable verbose logging
python manual_insights.py --process-pending --verbose
```

### 4. Frontend Management

Access the insights management interface through the Admin dashboard:

1. Navigate to `/admin` (requires admin privileges)
2. Click the "Insights" tab
3. View status, trigger processing, and manage insights

## API Reference

### POST /insights/trigger

Manually trigger insights processing.

**Request Body:**
```json
{
  "document_ids": ["doc1", "doc2"],  // Optional: specific documents
  "user_id": "user123",              // Optional: filter by user
  "force_reprocess": false           // Optional: reprocess existing
}
```

### POST /insights/webhook

Webhook for external triggers.

**Request Body:**
```json
{
  "trigger_type": "document_processed",
  "document_id": "doc123",
  "user_id": "user123",
  "metadata": {}
}
```

### GET /insights/status

Returns current processing status and statistics.

**Response:**
```json
{
  "service_available": true,
  "insights_today": 15,
  "documents_pending": 3,
  "total_insights": 150,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Integration with RAG Pipeline

The insights module integrates seamlessly with the existing RAG pipeline:

### File Processing Integration

In `common/db_handler.py`, the `process_file_for_rag` function automatically triggers insights processing:

```python
# Process insights if enabled and user_id provided
if insights_processor and user_id and text:
    asyncio.create_task(process_insights_for_document(
        document_id=file_id,
        content=text,
        metadata=metadata,
        user_id=user_id
    ))
```

### Document Processing Flow

1. Document uploaded to RAG pipeline
2. Text extracted and chunked
3. Embeddings created and stored
4. **Insights automatically processed** (if enabled)
5. Insights saved to database with metadata links

## Configuration

### Auto-Processing Control

Control which documents get processed for insights:

```python
def should_process_insights(self, metadata: Dict[str, Any]) -> bool:
    # Check file type - focus on text-based documents
    file_type = metadata.get('file_type', '').lower()
    supported_types = ['txt', 'md', 'docx', 'pdf', 'json']
    
    if file_type not in supported_types:
        return False
    
    # Check content length - avoid processing very short documents
    content_length = metadata.get('content_length', 0)
    if content_length < 100:
        return False
    
    return True
```

### Batch Processing

Configure batch processing limits:

```env
INSIGHTS_BATCH_SIZE=5  # Process 5 documents concurrently
```

## Error Handling

The insights module includes comprehensive error handling:

- Failed insights processing doesn't break the RAG pipeline
- Individual insight extraction failures are logged but don't stop batch processing
- Graceful degradation when OpenAI API is unavailable
- Database connection resilience

## Monitoring

Monitor insights processing through:

1. **Frontend Dashboard**: Real-time status and statistics
2. **API Endpoints**: Programmatic status checks
3. **Logs**: Detailed processing logs
4. **Database**: Direct query of insights table

## Development

### Adding New Insight Types

1. Add to `InsightType` enum in `insights_service.py`
2. Update LLM prompt to include new type
3. Update frontend UI to display new type

### Customizing Processing Logic

Modify the `_generate_insights_with_llm` method to:
- Adjust prompt engineering
- Change confidence thresholds
- Add custom validation logic

### Testing

The module includes comprehensive error handling and logging for production use. For development testing:

1. Set `AUTO_PROCESS_INSIGHTS=false` to disable automatic processing
2. Use manual triggers for controlled testing
3. Monitor logs for processing details

## Security

- Webhook endpoints support signature verification
- User-based filtering for multi-tenant environments
- Row-level security through Supabase RLS policies
- API key protection for OpenAI integration

## Performance

- Asynchronous processing prevents blocking the RAG pipeline
- Batch processing for multiple documents
- Configurable concurrency limits
- Efficient database operations with proper indexing