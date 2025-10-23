"""
Enhanced Insights API for RAG Pipeline

Provides API endpoints for enhanced business insights processing, replacing the basic system
with sophisticated GPT-5 powered business intelligence extraction.
"""

import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from pathlib import Path

# Set up path for imports
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'common'))

from common.db_handler import supabase
from insights.enhanced import EnhancedInsightsProcessor, get_enhanced_insights_router
from openai import AsyncOpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Enhanced RAG Pipeline Insights API",
    description="Advanced business insights API powered by GPT-5 for sophisticated business intelligence extraction",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize enhanced insights processor
enhanced_insights_processor = None
try:
    # Initialize OpenAI client
    api_key = os.getenv('LLM_API_KEY') or os.getenv('OPENAI_API_KEY')
    if api_key:
        openai_client = AsyncOpenAI(api_key=api_key)
        enhanced_insights_processor = EnhancedInsightsProcessor(
            supabase_client=supabase,
            openai_client=openai_client
        )
        logger.info("Enhanced insights processor initialized successfully")
        
        # Include enhanced insights router
        enhanced_router = get_enhanced_insights_router()
        app.include_router(enhanced_router)
        
    else:
        logger.warning("OpenAI API key not found - enhanced insights disabled")
except Exception as e:
    logger.error(f"Failed to initialize enhanced insights processor: {e}")


# Request/Response Models
class ManualInsightsRequest(BaseModel):
    """Request model for manual insights processing."""
    document_ids: Optional[List[str]] = None
    user_id: Optional[str] = None
    force_reprocess: bool = False


class LegacyInsightsStatusResponse(BaseModel):
    """Response model for backward compatibility with legacy insights status."""
    service_available: bool
    insights_today: int
    documents_pending: int
    total_insights: int
    enhanced_insights_available: bool
    timestamp: str


class SystemStatusResponse(BaseModel):
    """Response model for enhanced system status."""
    service_available: bool
    enhanced_insights_enabled: bool
    model_used: str
    insights_today: int
    documents_pending: int
    total_insights: int
    insights_by_severity: Dict[str, int]
    processing_stats: Dict[str, Any]
    timestamp: str


# Main API Endpoints
@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {
        "message": "Enhanced RAG Pipeline Insights API",
        "version": "2.0.0",
        "enhanced_insights_available": enhanced_insights_processor is not None,
        "model": os.getenv('LLM_CHOICE', 'gpt-5'),
        "features": [
            "GPT-5 powered insights",
            "Advanced business intelligence",
            "Financial impact analysis",
            "Critical path detection",
            "Stakeholder analysis",
            "Urgency indicators"
        ],
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint."""
    try:
        health_status = {
            "status": "healthy",
            "enhanced_insights_processor": enhanced_insights_processor is not None,
            "database_connected": False,
            "openai_connected": False,
            "model": os.getenv('LLM_CHOICE', 'gpt-5'),
            "timestamp": datetime.now().isoformat()
        }
        
        # Test database connection
        try:
            result = supabase.table('document_insights').select('id').limit(1).execute()
            health_status["database_connected"] = True
        except Exception as e:
            logger.warning(f"Database health check failed: {e}")
        
        # Test OpenAI connection
        if enhanced_insights_processor:
            try:
                await enhanced_insights_processor.insights_engine.openai_client.models.list()
                health_status["openai_connected"] = True
            except Exception as e:
                logger.warning(f"OpenAI health check failed: {e}")
        
        # Determine overall status
        if health_status["enhanced_insights_processor"] and health_status["database_connected"]:
            health_status["status"] = "healthy"
        else:
            health_status["status"] = "degraded"
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


@app.post("/insights/trigger")
async def trigger_insights_manual(
    request: ManualInsightsRequest,
    background_tasks: BackgroundTasks
):
    """
    Manually trigger enhanced insights processing for specific documents or all pending documents.
    """
    if not enhanced_insights_processor:
        raise HTTPException(status_code=503, detail="Enhanced insights service not available")
    
    logger.info(f"Manual enhanced insights trigger requested: {request.dict()}")
    
    # Add background task for processing
    background_tasks.add_task(
        _process_manual_enhanced_insights,
        request.document_ids,
        request.user_id,
        request.force_reprocess
    )
    
    return {
        "message": "Enhanced insights processing started",
        "document_ids": request.document_ids,
        "user_id": request.user_id,
        "force_reprocess": request.force_reprocess,
        "processor": "enhanced_gpt5",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/status/enhanced", response_model=SystemStatusResponse)
async def get_enhanced_system_status():
    """
    Get comprehensive enhanced insights system status and statistics.
    """
    try:
        # Get insights count for today
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        insights_today_result = supabase.table('document_insights')\
            .select('id', count='exact')\
            .gte('created_at', today.isoformat())\
            .execute()
        
        insights_today = insights_today_result.count if insights_today_result.count else 0
        
        # Get total insights count
        total_insights_result = supabase.table('document_insights')\
            .select('*', count='exact')\
            .execute()
        
        total_insights = total_insights_result.count if total_insights_result.count else 0
        
        # Get insights by severity
        insights_by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        if total_insights_result.data:
            for insight in total_insights_result.data:
                severity = insight.get('severity', 'medium')
                if severity in insights_by_severity:
                    insights_by_severity[severity] += 1
        
        # Get documents pending processing
        all_docs_result = supabase.table('documents')\
            .select('id')\
            .execute()
        
        processed_docs_result = supabase.table('document_insights')\
            .select('document_id')\
            .execute()
        
        processed_doc_ids = set()
        if processed_docs_result.data:
            processed_doc_ids = {doc['document_id'] for doc in processed_docs_result.data if doc['document_id']}
        
        total_docs = len(all_docs_result.data) if all_docs_result.data else 0
        documents_pending = total_docs - len(processed_doc_ids)
        
        # Calculate processing stats
        processing_stats = {
            "documents_processed": len(processed_doc_ids),
            "total_documents": total_docs,
            "processing_rate": round(len(processed_doc_ids) / max(total_docs, 1) * 100, 2),
            "average_insights_per_doc": round(total_insights / max(len(processed_doc_ids), 1), 2)
        }
        
        return SystemStatusResponse(
            service_available=enhanced_insights_processor is not None,
            enhanced_insights_enabled=enhanced_insights_processor is not None,
            model_used=os.getenv('LLM_CHOICE', 'gpt-5'),
            insights_today=insights_today,
            documents_pending=documents_pending,
            total_insights=total_insights,
            insights_by_severity=insights_by_severity,
            processing_stats=processing_stats,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to get enhanced system status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get system status")


# Legacy compatibility endpoints
@app.get("/insights/status", response_model=LegacyInsightsStatusResponse)
async def get_insights_status():
    """
    Legacy insights status endpoint for backward compatibility.
    Now uses enhanced insights from document_insights table.
    """
    try:
        # Get insights count for today
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        insights_today_result = supabase.table('document_insights')\
            .select('id', count='exact')\
            .gte('created_at', today.isoformat())\
            .execute()
        
        insights_today = insights_today_result.count if insights_today_result.count else 0
        
        # Get total insights count
        total_insights_result = supabase.table('document_insights')\
            .select('id', count='exact')\
            .execute()
        
        total_insights = total_insights_result.count if total_insights_result.count else 0
        
        # Get documents pending insights processing
        all_docs_result = supabase.table('documents')\
            .select('id')\
            .execute()
        
        processed_docs_result = supabase.table('document_insights')\
            .select('document_id')\
            .execute()
        
        processed_doc_ids = set()
        if processed_docs_result.data:
            processed_doc_ids = {doc['document_id'] for doc in processed_docs_result.data 
                               if doc['document_id']}
        
        total_docs = len(all_docs_result.data) if all_docs_result.data else 0
        documents_pending = total_docs - len(processed_doc_ids)
        
        return LegacyInsightsStatusResponse(
            service_available=enhanced_insights_processor is not None,
            insights_today=insights_today,
            documents_pending=documents_pending,
            total_insights=total_insights,
            enhanced_insights_available=enhanced_insights_processor is not None,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Failed to get insights status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get insights status")


@app.get("/insights/recent")
async def get_recent_insights(
    limit: int = 10,
    user_id: Optional[str] = None
):
    """
    Get recent enhanced insights.
    """
    try:
        query = supabase.table('document_insights')\
            .select('*')\
            .order('created_at', desc=True)\
            .limit(limit)
        
        # Note: User filtering would require joining with documents table
        # For now, we'll skip user filtering for simplicity
        
        result = query.execute()
        
        return {
            "insights": result.data or [],
            "count": len(result.data) if result.data else 0,
            "source": "enhanced_insights",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get recent insights: {e}")
        raise HTTPException(status_code=500, detail="Failed to get recent insights")


@app.post("/insights/process-pending")
async def process_pending_insights(
    background_tasks: BackgroundTasks,
    user_id: Optional[str] = None
):
    """
    Process all documents in the enhanced insights processing queue.
    """
    if not enhanced_insights_processor:
        raise HTTPException(status_code=503, detail="Enhanced insights service not available")
    
    logger.info(f"Processing pending enhanced insights queue for user: {user_id}")
    
    # Add background task
    background_tasks.add_task(
        _process_pending_enhanced_queue,
        user_id
    )
    
    return {
        "message": "Processing pending enhanced insights queue",
        "user_id": user_id,
        "processor": "enhanced_gpt5",
        "timestamp": datetime.now().isoformat()
    }


# Background Tasks
async def _process_manual_enhanced_insights(
    document_ids: Optional[List[str]],
    user_id: Optional[str],
    force_reprocess: bool
):
    """Background task for manual enhanced insights processing."""
    try:
        logger.info(f"Starting manual enhanced insights processing: {document_ids}")
        
        if document_ids:
            # Process specific documents
            results = []
            for doc_id in document_ids:
                result = await enhanced_insights_processor.trigger_insights_for_document(
                    document_id=doc_id,
                    user_id=user_id,
                    force_reprocess=force_reprocess
                )
                results.append(result)
                logger.info(f"Processed enhanced insights for document {doc_id}: "
                           f"{result.get('insights_saved', 0)} insights created")
            
            total_insights = sum(r.get('insights_saved', 0) for r in results)
            logger.info(f"Manual processing completed: {total_insights} total insights created")
        else:
            # Process all pending
            result = await enhanced_insights_processor.process_pending_insights_queue(user_id)
            logger.info(f"Processed pending enhanced insights queue: "
                       f"{result.get('total_insights_created', 0)} insights created")
            
    except Exception as e:
        logger.error(f"Manual enhanced insights processing failed: {e}")


async def _process_pending_enhanced_queue(user_id: Optional[str]):
    """Background task for processing pending enhanced insights queue."""
    try:
        logger.info(f"Processing pending enhanced insights queue for user: {user_id}")
        result = await enhanced_insights_processor.process_pending_insights_queue(user_id)
        logger.info(f"Pending enhanced queue processing result: "
                   f"{result.get('total_insights_created', 0)} insights created")
        
    except Exception as e:
        logger.error(f"Pending enhanced queue processing failed: {e}")


# Webhook endpoints for external integrations
@app.post("/webhook/document-processed")
async def webhook_document_processed(
    document_id: str,
    user_id: Optional[str] = None,
    background_tasks: BackgroundTasks = None
):
    """
    Webhook endpoint triggered when a document is processed.
    Automatically starts enhanced insights extraction.
    """
    if not enhanced_insights_processor:
        return {"message": "Enhanced insights service not available"}
    
    logger.info(f"Document processed webhook triggered for {document_id}")
    
    # Add background task for insights processing
    background_tasks.add_task(
        _process_webhook_document,
        document_id,
        user_id
    )
    
    return {
        "message": "Enhanced insights processing triggered",
        "document_id": document_id,
        "timestamp": datetime.now().isoformat()
    }


async def _process_webhook_document(document_id: str, user_id: Optional[str]):
    """Background task for webhook document processing."""
    try:
        result = await enhanced_insights_processor.trigger_insights_for_document(
            document_id=document_id,
            user_id=user_id,
            force_reprocess=False
        )
        logger.info(f"Webhook processed enhanced insights for document {document_id}: "
                   f"{result.get('insights_saved', 0)} insights created")
    except Exception as e:
        logger.error(f"Webhook enhanced insights processing failed for {document_id}: {e}")


# Development server
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("INSIGHTS_API_PORT", "8002"))
    uvicorn.run(
        "insights_api:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
