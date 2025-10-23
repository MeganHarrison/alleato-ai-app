"""
ChatKit server implementation for OpenAI Agent Builder workflow
This provides the backend for ChatKit frontend integration
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import asyncio
from typing import AsyncIterator, Optional, Dict, Any
from datetime import datetime
import uuid
from openai import OpenAI

# Import our workflow
from alleato_workflow import ChatKitWorkflowAdapter

app = FastAPI()

# Configure CORS for frontend access
# Get allowed origins from environment variable
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:8081,http://localhost:3000').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Initialize workflow adapter
workflow_adapter = ChatKitWorkflowAdapter()

# Store for managing ChatKit sessions (in production, use Redis or database)
sessions_store = {}


class ChatKitSession:
    """Manages ChatKit session state"""
    def __init__(self, session_id: str, workflow_id: str, user_id: str):
        self.session_id = session_id
        self.workflow_id = workflow_id
        self.user_id = user_id
        self.thread_id = None
        self.created_at = datetime.utcnow()
        self.last_accessed = datetime.utcnow()
        self.client_secret = f"cs_{session_id}_{uuid.uuid4().hex}"
        
    def to_dict(self):
        return {
            "session_id": self.session_id,
            "workflow_id": self.workflow_id,
            "user_id": self.user_id,
            "thread_id": self.thread_id,
            "client_secret": self.client_secret,
            "created_at": self.created_at.isoformat(),
            "last_accessed": self.last_accessed.isoformat()
        }


@app.post("/api/chatkit/sessions")
async def create_chatkit_session(request: Request):
    """
    Create a new ChatKit session
    This endpoint is called by your backend to generate a client secret
    """
    try:
        body = await request.json()
        
        # Extract workflow configuration
        workflow_config = body.get("workflow", {})
        workflow_id = workflow_config.get("id", "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda")
        
        # User identification (you might want to use actual user auth here)
        user_id = body.get("user", f"user_{uuid.uuid4().hex[:8]}")
        
        # Create session
        session_id = uuid.uuid4().hex
        session = ChatKitSession(session_id, workflow_id, user_id)
        
        # Store session
        sessions_store[session.client_secret] = session
        
        return JSONResponse({
            "client_secret": session.client_secret,
            "session_id": session.session_id,
            "expires_at": (session.created_at.timestamp() + 3600)  # 1 hour expiry
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chatkit/refresh")
async def refresh_chatkit_session(request: Request):
    """
    Refresh an existing ChatKit session
    """
    try:
        body = await request.json()
        current_client_secret = body.get("currentClientSecret")
        
        if not current_client_secret or current_client_secret not in sessions_store:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Get existing session
        old_session = sessions_store[current_client_secret]
        
        # Create new session with same user/workflow
        new_session = ChatKitSession(
            uuid.uuid4().hex,
            old_session.workflow_id,
            old_session.user_id
        )
        new_session.thread_id = old_session.thread_id  # Preserve conversation
        
        # Clean up old session
        del sessions_store[current_client_secret]
        
        # Store new session
        sessions_store[new_session.client_secret] = new_session
        
        return JSONResponse({
            "client_secret": new_session.client_secret,
            "session_id": new_session.session_id,
            "expires_at": (new_session.created_at.timestamp() + 3600)
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chatkit/message")
async def handle_chatkit_message(request: Request):
    """
    Handle incoming messages from ChatKit frontend
    Streams responses back using Server-Sent Events
    """
    try:
        # Get authorization header
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization")
        
        client_secret = auth_header.replace("Bearer ", "")
        
        # Validate session
        if client_secret not in sessions_store:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        session = sessions_store[client_secret]
        session.last_accessed = datetime.utcnow()
        
        # Parse message
        body = await request.json()
        user_message = body.get("message", "")
        
        if not user_message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # Create streaming response
        async def generate_events():
            try:
                # Send initial acknowledgment
                yield f"data: {json.dumps({'type': 'ack', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
                
                # Stream workflow responses
                async for event in workflow_adapter.stream_response(
                    user_input=user_message,
                    thread_id=session.thread_id
                ):
                    # Update thread_id if returned
                    if "thread_id" in event:
                        session.thread_id = event["thread_id"]
                    
                    # Send event to frontend
                    yield f"data: {json.dumps(event)}\n\n"
                    
                    # Small delay to prevent overwhelming the client
                    await asyncio.sleep(0.1)
                
                # Send completion event
                yield f"data: {json.dumps({'type': 'done', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
                
            except Exception as e:
                # Send error event
                yield f"data: {json.dumps({'type': 'error', 'error': str(e), 'timestamp': datetime.utcnow().isoformat()})}\n\n"
        
        return StreamingResponse(
            generate_events(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/chatkit/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# Optional: Clean up expired sessions periodically
async def cleanup_expired_sessions():
    """Remove expired sessions from memory"""
    while True:
        current_time = datetime.utcnow()
        expired_secrets = []
        
        for secret, session in sessions_store.items():
            # Remove sessions older than 1 hour
            if (current_time - session.created_at).total_seconds() > 3600:
                expired_secrets.append(secret)
        
        for secret in expired_secrets:
            del sessions_store[secret]
        
        # Run every 5 minutes
        await asyncio.sleep(300)


# Start cleanup task when the app starts
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_expired_sessions())


# Add these endpoints to your existing agent_api.py file
# or run this as a separate service on a different port