from typing import List, Optional, Dict, Any, AsyncIterator, Union, Tuple
from fastapi import FastAPI, HTTPException, Security, Depends, Request, Form
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager, nullcontext
from supabase import create_client, Client
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from dotenv import load_dotenv
from httpx import AsyncClient
from pathlib import Path
from mem0 import Memory
import asyncio
import base64
import time
import json
import sys
import os

# Import Langfuse configuration
from configure_langfuse import configure_langfuse

# Import database utility functions
from db_utils import (
    fetch_conversation_history,
    create_conversation,
    update_conversation_title,
    generate_session_id,
    generate_conversation_title,
    store_message,
    convert_history_to_pydantic_format,
    check_rate_limit,
    store_request
)

from pydantic_ai import Agent, BinaryContent
# Import all the message part classes from Pydantic AI
from pydantic_ai.messages import (
    ModelMessage, ModelRequest, ModelResponse, TextPart, ModelMessagesTypeAdapter,
    UserPromptPart, PartDeltaEvent, PartStartEvent, TextPartDelta
)

from agent import agent, AgentDeps, get_model
from clients import get_agent_clients, get_mem0_client_async
# from insights_worker import managed_worker  # Disabled for now

# Import ChatKit integration
from chatkit_integration import (
    create_chatkit_session,
    refresh_chatkit_session, 
    handle_chatkit_message,
    health_check as chatkit_health
)

# Check if we're in production
is_production = os.getenv("ENVIRONMENT") == "production"

if not is_production:
    # Development: prioritize .env file
    project_root = Path(__file__).resolve().parent
    dotenv_path = project_root / '.env'
    load_dotenv(dotenv_path, override=True)
else:
    # Production: use cloud platform env vars only
    load_dotenv()

# Define clients as None initially
embedding_client = None
supabase = None
http_client = None
title_agent = None
mem0_client = None
tracer = None

# Define the lifespan context manager for the application
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for the FastAPI application.
    
    Handles initialization and cleanup of resources.
    """
    global embedding_client, supabase, http_client, title_agent, mem0_client, tracer

    # Initialize Langfuse tracer (returns None if not configured)
    tracer = configure_langfuse()    
    
    # Startup: Initialize all clients
    embedding_client, supabase = get_agent_clients()
    http_client = AsyncClient()
    title_agent = Agent(model=get_model())
    # mem0_client = await get_mem0_client_async()  # Temporarily disabled for testing
    mem0_client = None  # Mock for testing
    
    # Start the insights worker alongside the main application (disabled)
    # async with managed_worker(polling_interval=30) as insights_worker:
    #     print("✅ Insights worker started successfully")
    #     yield  # This is where the app runs
    #     print("🔄 Shutting down insights worker...")
    print("✅ Agent API started (insights worker disabled)")
    yield  # This is where the app runs
    
    # Shutdown: Clean up resources
    if http_client:
        await http_client.aclose()

# Initialize FastAPI app
app = FastAPI(lifespan=lifespan)
security = HTTPBearer()        

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    """
    Verify the JWT token from Supabase and return the user information.
    
    Args:
        credentials: The HTTP Authorization credentials containing the bearer token
        
    Returns:
        Dict[str, Any]: The user information from Supabase
        
    Raises:
        HTTPException: If the token is invalid or the user cannot be verified
    """
    try:
        # Get the token from the Authorization header
        token = credentials.credentials
        
        # Access the global HTTP client
        global http_client # noqa: F824
        if not http_client:
            raise HTTPException(status_code=500, detail="HTTP client not initialized")
        
        # Get the Supabase URL and anon key from environment variables
        # These should match the environment variable names used in your project
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        # Make request to Supabase auth API to get user info using the global HTTP client
        response = await http_client.get(
            f"{supabase_url}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": supabase_key
            }
        )
        
        # Check if the request was successful
        if response.status_code != 200:
            print(f"Auth response error: {response.text}")
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        
        # Return the user information
        user_data = response.json()
        return user_data
    except Exception as e:
        print(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")

# Request/Response Models
class FileAttachment(BaseModel):
    fileName: str
    content: str  # Base64 encoded content
    mimeType: str

class AgentRequest(BaseModel):
    query: str
    user_id: str
    request_id: str
    session_id: str
    files: Optional[List[FileAttachment]] = None


# Add this helper function to your backend code
async def stream_error_response(error_message: str, session_id: str):
    """
    Creates a streaming response for error messages.
    
    Args:
        error_message: The error message to display to the user
        session_id: The current session ID
        
    Yields:
        Encoded JSON chunks for the streaming response
    """
    # First yield the error message as text
    yield json.dumps({"text": error_message}).encode('utf-8') + b'\n'
    
    # Then yield a final chunk with complete flag
    final_data = {
        "text": error_message,
        "session_id": session_id,
        "error": error_message,
        "complete": True
    }
    yield json.dumps(final_data).encode('utf-8') + b'\n'

@app.post("/api/pydantic-agent")
async def pydantic_agent(request: AgentRequest, user: Dict[str, Any] = Depends(verify_token)):
    # Verify that the user ID in the request matches the user ID from the token
    if request.user_id != user.get("id"):
        return StreamingResponse(
            stream_error_response("User ID in request does not match authenticated user", request.session_id),
            media_type='text/plain'
        )
        
    try:
        # Check rate limit
        rate_limit_ok = await check_rate_limit(supabase, request.user_id)
        if not rate_limit_ok:
            return StreamingResponse(
                stream_error_response("Rate limit exceeded. Please try again later.", request.session_id),
                media_type='text/plain'
            )
        
        # Start request tracking in parallel
        request_tracking_task = asyncio.create_task(
            store_request(supabase, request.request_id, request.user_id, request.query)
        )
        
        session_id = request.session_id
        conversation_record = None
        conversation_title = None
        
        # Check if session_id is empty, create a new conversation if needed
        if not session_id:
            session_id = generate_session_id(request.user_id)
            # Create a new conversation record
            conversation_record = await create_conversation(supabase, request.user_id, session_id)
        
        # Store user's query immediately with any file attachments
        file_attachments = None
        if request.files:
            # Convert Pydantic models to dictionaries for storage
            file_attachments = [{
                "fileName": file.fileName,
                "content": file.content,
                "mimeType": file.mimeType
            } for file in request.files]
            
        await store_message(
            supabase=supabase,
            session_id=session_id,
            message_type="human",
            content=request.query,
            files=file_attachments
        )
        
        # Fetch conversation history from the DB
        conversation_history = await fetch_conversation_history(supabase, session_id)
        
        # Convert conversation history to Pydantic AI format
        pydantic_messages = await convert_history_to_pydantic_format(conversation_history)
        
        # Retrieve relevant memories with Mem0
        relevant_memories = {"results": []}
        if mem0_client:
            try:
                relevant_memories = await mem0_client.search(query=request.query, user_id=request.user_id, limit=3)
            except:
                # Slight hack - retry again with a new connection pool
                time.sleep(1)
                relevant_memories = await mem0_client.search(query=request.query, user_id=request.user_id, limit=3)

        memories_str = "\n".join(f"- {entry['memory']}" for entry in relevant_memories["results"])
        
        # Create memory task to run in parallel
        memory_messages = [{"role": "user", "content": request.query}]
        if mem0_client:
            memory_task = asyncio.create_task(mem0_client.add(memory_messages, user_id=request.user_id))
        else:
            memory_task = asyncio.create_task(asyncio.sleep(0))  # Mock task
        
        # Start title generation in parallel if this is a new conversation
        title_task = None
        if conversation_record:
            title_task = asyncio.create_task(generate_conversation_title(title_agent, request.query))
        
        async def stream_response():
            # Process title result if it exists (in the background)
            nonlocal conversation_title

            # Use the global HTTP client
            agent_deps = AgentDeps(
                embedding_client=embedding_client, 
                supabase=supabase, 
                http_client=http_client,
                brave_api_key=os.getenv("BRAVE_API_KEY", ""),
                searxng_base_url=os.getenv("SEARXNG_BASE_URL", ""),
                memories=memories_str
            )
            
            # Process any file attachments for the agent
            binary_contents = []
            if request.files:
                for file in request.files:
                    try:
                        # Decode the base64 content
                        binary_data = base64.b64decode(file.content)
                        # Create a BinaryContent object
                        fileMimeType = "application/pdf" if file.mimeType == "text/plain" else file.mimeType
                        binary_content = BinaryContent(
                            data=binary_data,
                            media_type=fileMimeType
                        )
                        binary_contents.append(binary_content)
                    except Exception as e:
                        print(f"Error processing file {file.fileName}: {str(e)}")
            
            # Create input for the agent with the query and any binary contents
            agent_input = [request.query]
            if binary_contents:
                agent_input.extend(binary_contents)
            
            full_response = ""
            
            # Use tracer context if available, otherwise use nullcontext
            span_context = tracer.start_as_current_span("Pydantic-Ai-Trace") if tracer else nullcontext()
            
            with span_context as span:
                if tracer and span:
                    # Set user and session attributes for Langfuse
                    span.set_attribute("langfuse.user.id", request.user_id)
                    span.set_attribute("langfuse.session.id", session_id)
                    span.set_attribute("input.value", request.query)
                
                # Run the agent with the user prompt, binary contents, and the chat history
                async with agent.iter(agent_input, deps=agent_deps, message_history=pydantic_messages) as run:
                    async for node in run:
                        if Agent.is_model_request_node(node):
                            # A model request node => We can stream tokens from the model's request
                            async with node.stream(run.ctx) as request_stream:
                                async for event in request_stream:
                                    if isinstance(event, PartStartEvent) and event.part.part_kind == 'text':
                                        yield json.dumps({"text": event.part.content}).encode('utf-8') + b'\n'
                                        full_response += event.part.content
                                    elif isinstance(event, PartDeltaEvent) and isinstance(event.delta, TextPartDelta):
                                        delta = event.delta.content_delta
                                        yield json.dumps({"text": full_response}).encode('utf-8') + b'\n'
                                        full_response += delta
                
                # Set the output value after completion if tracing
                if tracer and span:
                    span.set_attribute("output.value", full_response)
                    
            # After streaming is complete, store the full response in the database
            message_data = run.result.new_messages_json()
            
            # Store agent's response
            await store_message(
                supabase=supabase,
                session_id=session_id,
                message_type="ai",
                content=full_response,
                message_data=message_data,
                data={"request_id": request.request_id}
            )
            
            # Wait for title generation to complete if it's running
            if title_task:
                try:
                    title_result = await title_task
                    conversation_title = title_result
                    # Update the conversation title in the database
                    await update_conversation_title(supabase, session_id, conversation_title)
                    
                    # Send the final title in the last chunk
                    final_data = {
                        "text": full_response,
                        "session_id": session_id,
                        "conversation_title": conversation_title,
                        "complete": True
                    }
                    yield json.dumps(final_data).encode('utf-8') + b'\n'
                except Exception as e:
                    print(f"Error processing title: {str(e)}")
            else:
                yield json.dumps({"text": full_response, "complete": True}).encode('utf-8') + b'\n'

            # Wait for the memory task to complete if needed
            try:
                await memory_task
            except Exception as e:
                print(f"Error updating memories: {str(e)}")
                
            # Wait for request tracking task to complete
            try:
                await request_tracking_task
            except Exception as e:
                print(f"Error tracking request: {str(e)}")
            except asyncio.CancelledError:
                # This is expected if the task was cancelled
                pass
        
        return StreamingResponse(stream_response(), media_type='text/plain')

    except Exception as e:
        print(f"Error processing request: {str(e)}")
        # Store error message in conversation if session_id exists
        if request.session_id:
            await store_message(
                supabase=supabase,
                session_id=request.session_id,
                message_type="ai",
                content="I apologize, but I encountered an error processing your request.",
                data={"error": str(e), "request_id": request.request_id}
            )
        # Return a streaming response with the error
        return StreamingResponse(
            stream_error_response(f"Error: {str(e)}", request.session_id),
            media_type='text/plain'
        )


@app.get("/debug")
async def debug_endpoint():
    """Debug endpoint to test API connectivity without authentication."""
    return {
        "message": "API is reachable",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent_endpoint": os.getenv("VITE_AGENT_ENDPOINT", "not_set")
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint for container orchestration and monitoring.
    
    Returns:
        Dict with status and service health information
    """
    # Check if critical dependencies are initialized
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "embedding_client": embedding_client is not None,
            "supabase": supabase is not None,
            "http_client": http_client is not None,
            "title_agent": title_agent is not None,
            "mem0_client": mem0_client is not None  # Optional, can be None
        }
    }

    # Check only critical services (exclude mem0_client as it's optional)
    critical_services = {
        "embedding_client": embedding_client is not None,
        "supabase": supabase is not None,
        "http_client": http_client is not None,
        "title_agent": title_agent is not None
    }

    # If any critical service is not initialized, mark as unhealthy
    if not all(critical_services.values()):
        health_status["status"] = "unhealthy"
        raise HTTPException(status_code=503, detail=health_status)
    
    return health_status

@app.get("/api/insights/queue/stats")
async def get_insights_queue_stats():
    """Get current insights processing queue statistics."""
    try:
        result = supabase.rpc('get_insights_queue_stats').execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        return {
            "pending_count": 0,
            "processing_count": 0,
            "completed_count": 0,
            "failed_count": 0,
            "total_count": 0,
            "oldest_pending_age": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching queue stats: {str(e)}")

@app.post("/api/insights/process/retroactive")
async def trigger_retroactive_processing():
    """Trigger retroactive processing of all unprocessed documents."""
    try:
        from insights_worker import InsightsWorker
        worker = InsightsWorker()
        result = await worker.process_all_retroactively()
        return {
            "message": "Retroactive processing completed",
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in retroactive processing: {str(e)}")

@app.post("/api/insights/queue/reset-failed")
async def reset_failed_processing():
    """Reset failed processing attempts to allow retry."""
    try:
        result = supabase.rpc('reset_failed_processing').execute()
        reset_count = result.data if isinstance(result.data, int) else 0
        return {
            "message": f"Reset {reset_count} failed processing attempts",
            "reset_count": reset_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting failed processing: {str(e)}")


class FileUploadRequest(BaseModel):
    """Request model for processing uploaded files."""
    document_id: str
    file_path: str
    file_name: str
    mime_type: str


@app.post("/api/process-upload")
async def process_upload(
    request: FileUploadRequest,
    user: Dict[str, Any] = Depends(verify_token),
):
    """
    Process an uploaded file by downloading it from Supabase storage,
    generating embeddings, and storing them in the documents table.
    
    Args:
        request: FileUploadRequest with file details
        user: Authenticated user from token
        
    Returns:
        Success response with processing status
    """
    try:
        # Enforce per-user path ownership (defense-in-depth)
        user_id = user.get("id")
        if not user_id or not request.file_path.startswith(f"{user_id}/"):
            raise HTTPException(status_code=403, detail="Forbidden: file path not owned by user")
        
        # Download file from Supabase storage (sync call -> offload)
        file_bytes = await asyncio.to_thread(
            lambda: supabase.storage.from_("documents").download(request.file_path)
        )
        if not file_bytes:
            raise HTTPException(status_code=404, detail="File not found in storage")
        
        # Convert bytes to string for text processing
        file_content = (
            file_bytes.decode("utf-8", errors="replace")
            if request.mime_type.startswith("text/")
            else ""
        )
        
        # Import text processing utilities
        sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend_rag_pipeline', 'common'))
        from text_processor import chunk_text, create_embeddings
        
        # Process the document based on mime type
        if request.mime_type == 'text/csv':
            # For CSV files, extract schema and rows
            from text_processor import extract_schema_from_csv, extract_rows_from_csv
            
            # Extract schema and rows from raw bytes
            schema = extract_schema_from_csv(file_bytes)
            rows = extract_rows_from_csv(file_bytes)
            
            # Batch insert rows for better performance
            if rows:
                rows_payload = [
                    {"dataset_id": request.document_id, "row_data": row}
                    for row in rows
                ]
                supabase.table("document_rows").insert(rows_payload).execute()
            
            # Create text representation for embeddings
            file_content = f"Schema: {', '.join(schema)}\n\nSample rows:\n"
            for row in rows[:10]:  # Include first 10 rows as sample
                file_content += f"{row}\n"
        elif request.mime_type in [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]:
            # TODO: Implement proper Excel parsing (e.g., pandas/openpyxl) and row extraction
            # For now, treat as generic binary file
            file_content = f"Binary spreadsheet: {request.file_name} ({len(file_bytes)} bytes)"
        
        # Chunk the text
        chunks = chunk_text(file_content)
        
        # Generate embeddings for all chunks in one call
        embeddings = create_embeddings(chunks) if chunks else []
        if chunks and len(embeddings) != len(chunks):
            raise HTTPException(status_code=500, detail="Embedding count mismatch")
        
        # Store chunks and embeddings in documents table
        if chunks:
            # Batch insert all document chunks for better performance
            documents_to_insert = [
                {
                    "content": chunk,
                    "metadata": {
                        "file_id": request.document_id,
                        "storage_bucket": "documents",
                        "storage_path": request.file_path,
                        "file_title": request.file_name,
                        "mime_type": request.mime_type,
                        "chunk_index": i,
                        "uploaded_via": "web_interface"
                    },
                    "embedding": embedding
                }
                for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
            ]
            supabase.table("documents").insert(documents_to_insert).execute()
        
        # Update document metadata to mark as processed
        supabase.table("document_metadata").update({
            "processed": True,
            "chunks_count": len(chunks),
            "processing_date": datetime.now(timezone.utc).isoformat()
        }).eq("id", request.document_id).execute()
        
        return {
            "status": "success",
            "message": f"Successfully processed {request.file_name}",
            "chunks_created": len(chunks),
            "document_id": request.document_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing upload: {e!s}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {e!s}") from e


# ChatKit endpoints
app.add_api_route("/api/chatkit/sessions", create_chatkit_session, methods=["POST"])
app.add_api_route("/api/chatkit/refresh", refresh_chatkit_session, methods=["POST"])
app.add_api_route("/api/chatkit/message", handle_chatkit_message, methods=["POST"])
app.add_api_route("/api/chatkit/health", chatkit_health, methods=["GET"])


if __name__ == "__main__":
    import uvicorn
    import os
    # Use PORT environment variable from Render, fallback to 8001 for local development
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
