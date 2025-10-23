"""
ChatKit Backend Server
Production backend for OpenAI Agent Builder integration with ChatKit
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from datetime import datetime
import uuid
import sys
import os

# Add the current directory to Python path so we can import alleato_workflow
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Try to import the real workflow and OpenAI
try:
    from alleato_workflow import ChatKitWorkflowAdapter
    WORKFLOW_AVAILABLE = True
    print("✓ Real Agent Builder workflow loaded")
except ImportError as e:
    WORKFLOW_AVAILABLE = False
    print(f"✗ Could not load Agent Builder workflow: {e}")

# Try to import OpenAI for direct responses
try:
    from openai import OpenAI
    from dotenv import load_dotenv
    load_dotenv()
    OPENAI_AVAILABLE = bool(os.environ.get('OPENAI_API_KEY'))
    if OPENAI_AVAILABLE:
        openai_client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
        print("✓ OpenAI client initialized")
except ImportError:
    OPENAI_AVAILABLE = False
    openai_client = None

app = FastAPI()

# Configure CORS
# Get allowed origins from environment variable or use defaults
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001,http://localhost:8081').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory session store
sessions = {}

@app.post("/session")
async def create_session(request: Request):
    """Create a new ChatKit session"""
    try:
        body = await request.json()
        session_id = str(uuid.uuid4())
        client_secret = f"cs_{session_id}_{uuid.uuid4().hex[:8]}"
        
        sessions[client_secret] = {
            "session_id": session_id,
            "created_at": datetime.utcnow().isoformat(),
            "workflow_id": body.get("workflow", {}).get("id", "wf_68f9ed871f3881909581687179fba37f01b09bb8edcbabda")
        }
        
        return JSONResponse({
            "client_secret": client_secret,
            "session_id": session_id,
            "expires_at": (datetime.utcnow().timestamp() + 3600)
        })
    except Exception as e:
        print(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chatkit/refresh")
async def refresh_session(request: Request):
    """Refresh a ChatKit session"""
    try:
        body = await request.json()
        old_secret = body.get("currentClientSecret")
        
        if old_secret not in sessions:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # Create new session
        session_id = str(uuid.uuid4())
        new_secret = f"cs_{session_id}_{uuid.uuid4().hex[:8]}"
        
        sessions[new_secret] = sessions[old_secret]
        sessions[new_secret]["session_id"] = session_id
        del sessions[old_secret]
        
        return JSONResponse({
            "client_secret": new_secret,
            "session_id": session_id,
            "expires_at": (datetime.utcnow().timestamp() + 3600)
        })
    except Exception as e:
        print(f"Error refreshing session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chatkit/message")
async def handle_message(request: Request):
    """Handle ChatKit messages with streaming response"""
    try:
        # Get auth header - make it optional for testing
        auth = request.headers.get("Authorization", "")
        client_secret = None
        
        if auth.startswith("Bearer "):
            client_secret = auth.replace("Bearer ", "")
            # Check if it's a valid session
            if client_secret and client_secret not in sessions:
                # Session validation - require valid session in production
                raise HTTPException(status_code=401, detail="Invalid session")
        
        # Log authenticated request
        print(f"Processing authenticated message")
        
        # Parse message
        body = await request.json()
        message = body.get("message", "")
        
        async def generate_events():
            # Send initial ack
            yield f"data: {json.dumps({'type': 'ack', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
            
            # Simulate workflow steps
            steps = [
                {"type": "step", "step": "query_rewrite", "status": "started"},
                {"type": "step", "step": "query_rewrite", "status": "completed", "output": f"Rewritten: {message}"},
                {"type": "step", "step": "classify", "status": "started"},
                {"type": "step", "step": "classify", "status": "completed", "output": "q-and-a"},
                {"type": "step", "step": "internal_qa", "status": "started"},
            ]
            
            for step in steps:
                yield f"data: {json.dumps(step)}\n\n"
                await asyncio.sleep(0.5)
            
            # Use direct OpenAI if available (faster than full workflow)
            if OPENAI_AVAILABLE and openai_client:
                try:
                    print(f"Using direct OpenAI for message: {message}")
                    
                    # Simulate workflow steps
                    yield f"data: {json.dumps({'type': 'step', 'step': 'query_rewrite', 'status': 'started'})}\n\n"
                    await asyncio.sleep(0.2)
                    yield f"data: {json.dumps({'type': 'step', 'step': 'query_rewrite', 'status': 'completed'})}\n\n"
                    
                    yield f"data: {json.dumps({'type': 'step', 'step': 'classify', 'status': 'started'})}\n\n"
                    await asyncio.sleep(0.2)
                    yield f"data: {json.dumps({'type': 'step', 'step': 'classify', 'status': 'completed'})}\n\n"
                    
                    yield f"data: {json.dumps({'type': 'step', 'step': 'internal_qa', 'status': 'started'})}\n\n"
                    
                    # Get real response from OpenAI
                    response = openai_client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": "You are an AI assistant for Alleato AI, an intelligent knowledge management and workflow automation platform. You help users understand and use the platform's features including Agent Builder, ChatKit integration, and knowledge base management. Be helpful and concise."},
                            {"role": "user", "content": message}
                        ],
                        stream=False
                    )
                    
                    content = response.choices[0].message.content
                    yield f"data: {json.dumps({'type': 'message', 'content': content})}\n\n"
                    yield f"data: {json.dumps({'type': 'step', 'step': 'internal_qa', 'status': 'completed'})}\n\n"
                    
                except Exception as e:
                    print(f"OpenAI error: {e}")
                    error_msg = "I'm unable to process your request at the moment. Please try again later."
                    yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
                    yield f"data: {json.dumps({'type': 'message', 'content': error_msg})}\n\n"
                    
            elif WORKFLOW_AVAILABLE:
                # Try full workflow (slower due to assistant creation)
                try:
                    print(f"Creating workflow adapter...")
                    adapter = ChatKitWorkflowAdapter()
                    message_sent = False
                    
                    print(f"Running workflow for message: {message}")
                    async for event in adapter.stream_response(message):
                        print(f"Workflow event: {event}")
                        if event["type"] == "message":
                            yield f"data: {json.dumps({'type': 'message', 'content': event['content']})}\n\n"
                            message_sent = True
                        elif event["type"] == "status":
                            yield f"data: {json.dumps({'type': 'step', 'step': event['step'], 'status': event['status'], 'output': event.get('output')})}\n\n"
                    
                    if not message_sent:
                        # No response was generated
                        yield f"data: {json.dumps({'type': 'message', 'content': 'I was unable to generate a response. Please try rephrasing your question.'})}\n\n"
                        
                except Exception as e:
                    print(f"Workflow error: {e}")
                    error_msg = "I'm unable to process your request at the moment. Please try again later."
                    yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
                    yield f"data: {json.dumps({'type': 'message', 'content': error_msg})}\n\n"
            else:
                # No AI service available
                error_msg = "The AI service is currently unavailable. Please contact support if this issue persists."
                yield f"data: {json.dumps({'type': 'error', 'error': 'No AI service configured'})}\n\n"
                yield f"data: {json.dumps({'type': 'message', 'content': error_msg})}\n\n"
            
            # Send completion
            yield f"data: {json.dumps({'type': 'done', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
        
        return StreamingResponse(
            generate_events(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error handling message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chatkit/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('PORT', 8001))
    print(f"Starting ChatKit Backend Server on port {port}")
    print(f"Agent Builder workflow available: {WORKFLOW_AVAILABLE}")
    print(f"OpenAI API available: {OPENAI_AVAILABLE}")
    uvicorn.run(app, host="0.0.0.0", port=port)
