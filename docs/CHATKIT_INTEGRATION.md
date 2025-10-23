# ChatKit Integration Guide

This guide documents the integration of OpenAI's ChatKit with the Agent Builder workflow for the Alleato Internal Knowledge Base Assistant.

## Overview

The ChatKit integration provides a production-ready chat interface powered by OpenAI's Agent Builder. It features:

- **Multi-agent workflow** with query rewriting, classification, and specialized response generation
- **Real-time streaming** responses with progress indicators
- **Vector search** integration with your knowledge base
- **Web search** capabilities for external information
- **Built-in safety features** and guardrails
- **Rich UI components** with widgets and interactive elements

## Architecture

### Backend Components

1. **OpenAI Agent Workflow** (`backend_agent_api/internal_knowledge_base/openai_agent_workflow_python.py`)
   - Converted TypeScript workflow to Python
   - Implements multi-step agent processing
   - Handles vector store searches and tool execution

2. **ChatKit Server Integration** (`backend_agent_api/chatkit_integration.py`)
   - Session management endpoints
   - Message handling with SSE streaming
   - Authentication and authorization

3. **API Endpoints**
   - `POST /api/chatkit/sessions` - Create new chat sessions
   - `POST /api/chatkit/refresh` - Refresh existing sessions
   - `POST /api/chatkit/message` - Handle chat messages
   - `GET /api/chatkit/health` - Health check

### Frontend Components

1. **ChatKit Integration Component** (`frontend/src/components/ChatKitIntegration.tsx`)
   - Handles ChatKit script loading
   - Manages session lifecycle
   - Configures ChatKit options

2. **Demo Page** (`frontend/src/pages/ChatKitDemo.tsx`)
   - Showcases the assistant capabilities
   - Provides example queries
   - Shows workflow visualization

## Setup Instructions

### Prerequisites

- OpenAI API key with access to Assistants API
- Vector store created in OpenAI platform
- Node.js 18+ and Python 3.11+

### Backend Setup

1. Install dependencies:
   ```bash
   cd backend_agent_api
   pip install -r requirements.txt
   ```

2. Configure environment variables:
   ```env
   OPENAI_API_KEY=your-api-key
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_KEY=your-service-key
   ```

3. Update the vector store ID in `openai_agent_workflow_python.py`:
   ```python
   self.vector_store_id = "your-vector-store-id"
   ```

4. Start the backend server:
   ```bash
   uvicorn agent_api:app --reload --port 8001
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Configure environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_BASE_URL=http://localhost:8001
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the ChatKit interface at `http://localhost:3000/chatkit`

## Workflow Details

The agent workflow consists of these steps:

1. **Query Rewriting**
   - Optimizes user questions for knowledge base search
   - Uses GPT-4 to improve query specificity

2. **Classification**
   - Determines if the query is Q&A or fact-finding
   - Routes to appropriate specialized agent

3. **Specialized Processing**
   - **Q&A Agent**: Searches internal knowledge base and provides concise answers
   - **Fact-Finding Agent**: Uses web search and code interpreter for research
   - **General Agent**: Handles other queries and asks for clarification

## Customization

### Modifying the Workflow

1. Update agent instructions in `openai_agent_workflow_python.py`
2. Add or remove tools in the assistant configurations
3. Modify the classification logic for different routing

### Styling ChatKit

Update the ChatKit options in `ChatKitIntegration.tsx`:

```typescript
const options: ChatKitOptions = {
  theme: 'light', // or 'dark'
  header: {
    title: "Your Custom Title",
    subtitle: "Your subtitle"
  },
  composer: {
    placeholder: "Your custom placeholder..."
  }
};
```

### Adding Custom Widgets

ChatKit supports custom widgets for rich interactions. See the [widgets documentation](https://widgets.chatkit.studio) for examples.

## Security Considerations

1. **Authentication**: All ChatKit sessions require authenticated users
2. **Session Management**: Sessions expire after 1 hour
3. **Rate Limiting**: Implement rate limiting on the session creation endpoint
4. **Input Validation**: The workflow includes built-in guardrails for safety

## Troubleshooting

### Common Issues

1. **ChatKit script not loading**
   - Check network connectivity
   - Verify Content Security Policy allows OpenAI CDN
   - Check browser console for errors

2. **Session creation fails**
   - Verify OpenAI API key is valid
   - Check authentication token
   - Review server logs for errors

3. **Workflow errors**
   - Ensure vector store ID is correct
   - Verify assistants have required permissions
   - Check tool configurations

### Debug Mode

Enable debug logging in the backend:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

View ChatKit events in browser console:

```javascript
chatKitElement.addEventListener('chatkit.log', (event) => {
  console.log('ChatKit log:', event.detail);
});
```

## Production Deployment

### Backend Deployment

1. Use environment variables for all secrets
2. Enable HTTPS for all endpoints
3. Implement proper error handling
4. Set up monitoring and logging
5. Configure CORS for your domain

### Frontend Deployment

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Configure production API URL
3. Enable caching for ChatKit script
4. Set up error tracking

### Scaling Considerations

- Use Redis for session storage instead of in-memory
- Implement connection pooling for database
- Consider rate limiting per user
- Monitor OpenAI API usage and costs

## Support

For issues or questions:
1. Check the [OpenAI documentation](https://platform.openai.com/docs)
2. Review [ChatKit documentation](https://github.com/openai/chatkit-python)
3. Submit issues to the project repository