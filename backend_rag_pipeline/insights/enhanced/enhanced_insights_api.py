"""
Enhanced Insights API

RESTful API endpoints for the enhanced business insights system.
Provides endpoints for processing documents, retrieving insights, and managing
the insights generation pipeline.
"""

import os
import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Depends
from pydantic import BaseModel, Field
from openai import AsyncOpenAI
from supabase import create_client, Client

from .enhanced_insights_processor import EnhancedInsightsProcessor

logger = logging.getLogger(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Initialize OpenAI client
api_key = os.getenv('LLM_API_KEY') or os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError("LLM_API_KEY or OPENAI_API_KEY environment variable is required")

openai_client = AsyncOpenAI(api_key=api_key)

# Initialize insights processor
insights_processor = EnhancedInsightsProcessor(
    supabase_client=supabase,
    openai_client=openai_client
)

# Create API router
router = APIRouter(prefix="/api/enhanced-insights", tags=["Enhanced Insights"])


# Request/Response Models
class ProcessDocumentRequest(BaseModel):
    """Request model for processing a single document."""
    document_id: str = Field(..., description="Document ID to process")
    force_reprocess: bool = Field(False, description="Force reprocessing even if insights exist")
    user_id: Optional[str] = Field(None, description="User ID for filtering")


class ProcessBatchRequest(BaseModel):
    """Request model for batch processing documents."""
    document_ids: List[str] = Field(..., description="List of document IDs to process")
    user_id: Optional[str] = Field(None, description="User ID for filtering")


class InsightResponse(BaseModel):
    """Response model for insight data."""
    id: str
    document_id: str
    insight_type: str
    title: str
    description: str
    severity: str
    confidence_score: float
    business_impact: Optional[str]
    assignee: Optional[str]
    due_date: Optional[str]
    financial_impact: Optional[float]
    created_at: str


class ProcessingResultResponse(BaseModel):
    """Response model for processing results."""
    success: bool
    document_id: str
    insights_extracted: int
    insights_saved: int
    insight_ids: List[str]
    processing_time_seconds: float
    insights_by_type: Optional[Dict[str, int]] = None
    insights_by_severity: Optional[Dict[str, int]] = None
    error: Optional[str] = None


class BatchProcessingResponse(BaseModel):
    """Response model for batch processing results."""
    total_documents: int
    successful_documents: int
    skipped_documents: int
    failed_documents: int
    total_insights_created: int
    processing_time_seconds: float
    average_insights_per_doc: float
    results: List[ProcessingResultResponse]


class InsightsSummaryResponse(BaseModel):
    """Response model for insights summary."""
    total_insights: int
    recent_insights_7_days: int
    insights_by_type: Dict[str, int]
    insights_by_severity: Dict[str, int]
    most_common_type: Optional[str]
    critical_insights: int
    high_priority_insights: int


# API Endpoints

@router.post("/process-document", response_model=ProcessingResultResponse)
async def process_document(
    request: ProcessDocumentRequest,
    background_tasks: BackgroundTasks
) -> ProcessingResultResponse:
    """
    Process a single document for enhanced business insights.
    
    This endpoint extracts sophisticated business insights from a document
    using GPT-5 and advanced prompting techniques.
    """
    try:
        logger.info(f"Processing document {request.document_id} for enhanced insights")
        
        result = await insights_processor.trigger_insights_for_document(
            document_id=request.document_id,
            user_id=request.user_id,
            force_reprocess=request.force_reprocess
        )
        
        return ProcessingResultResponse(**result)
        
    except Exception as e:
        logger.error(f"Error processing document {request.document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-batch", response_model=BatchProcessingResponse)
async def process_batch(
    request: ProcessBatchRequest,
    background_tasks: BackgroundTasks
) -> BatchProcessingResponse:
    """
    Process multiple documents for enhanced business insights in batch.
    
    This endpoint efficiently processes multiple documents concurrently
    while respecting rate limits for GPT-5.
    """
    try:
        logger.info(f"Processing batch of {len(request.document_ids)} documents")
        
        # Get document details
        documents = []
        for doc_id in request.document_ids:
            try:
                doc_result = supabase.table('documents').select('*').eq('id', doc_id).single().execute()
                if doc_result.data:
                    documents.append(doc_result.data)
            except Exception as e:
                logger.warning(f"Could not fetch document {doc_id}: {e}")
                continue
        
        if not documents:
            raise HTTPException(status_code=400, detail="No valid documents found")
        
        result = await insights_processor.process_batch_insights(
            documents=documents,
            user_id=request.user_id
        )
        
        return BatchProcessingResponse(**result)
        
    except Exception as e:
        logger.error(f"Error processing batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-queue")
async def process_pending_queue(
    user_id: Optional[str] = Query(None, description="User ID filter"),
    background_tasks: BackgroundTasks = None
) -> BatchProcessingResponse:
    """
    Process all documents in the pending insights queue.
    
    This endpoint finds documents that haven't been processed for insights
    and processes them using the enhanced insights engine.
    """
    try:
        logger.info("Processing pending insights queue")
        
        result = await insights_processor.process_pending_insights_queue(user_id=user_id)
        
        return BatchProcessingResponse(**result)
        
    except Exception as e:
        logger.error(f"Error processing queue: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/{document_id}")
async def get_document_insights(
    document_id: str,
    user_id: Optional[str] = Query(None, description="User ID filter")
) -> List[InsightResponse]:
    """
    Get all insights for a specific document.
    """
    try:
        query = supabase.table('document_insights').select('*').eq('document_id', document_id)
        
        # Note: User filtering would require joining with documents table
        # For now, we'll skip user filtering for simplicity
        
        result = query.execute()
        
        insights = []
        for insight_data in result.data or []:
            insight = InsightResponse(
                id=insight_data['id'],
                document_id=insight_data['document_id'],
                insight_type=insight_data['insight_type'],
                title=insight_data['title'],
                description=insight_data['description'],
                severity=insight_data['severity'],
                confidence_score=insight_data['confidence_score'],
                business_impact=insight_data.get('business_impact'),
                assignee=insight_data.get('assignee'),
                due_date=insight_data.get('due_date'),
                financial_impact=insight_data.get('financial_impact'),
                created_at=insight_data['created_at']
            )
            insights.append(insight)
        
        return insights
        
    except Exception as e:
        logger.error(f"Error fetching insights for document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights")
async def get_insights(
    insight_type: Optional[str] = Query(None, description="Filter by insight type"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
    limit: int = Query(50, description="Maximum number of insights to return"),
    offset: int = Query(0, description="Number of insights to skip")
) -> List[InsightResponse]:
    """
    Get insights with optional filtering and pagination.
    """
    try:
        query = supabase.table('document_insights').select('*')
        
        # Apply filters
        if insight_type:
            query = query.eq('insight_type', insight_type)
        if severity:
            query = query.eq('severity', severity)
        if resolved is not None:
            query = query.eq('resolved', resolved)
        
        # Apply pagination
        query = query.range(offset, offset + limit - 1)
        
        # Order by creation date (newest first)
        query = query.order('created_at', desc=True)
        
        result = query.execute()
        
        insights = []
        for insight_data in result.data or []:
            insight = InsightResponse(
                id=insight_data['id'],
                document_id=insight_data['document_id'],
                insight_type=insight_data['insight_type'],
                title=insight_data['title'],
                description=insight_data['description'],
                severity=insight_data['severity'],
                confidence_score=insight_data['confidence_score'],
                business_impact=insight_data.get('business_impact'),
                assignee=insight_data.get('assignee'),
                due_date=insight_data.get('due_date'),
                financial_impact=insight_data.get('financial_impact'),
                created_at=insight_data['created_at']
            )
            insights.append(insight)
        
        return insights
        
    except Exception as e:
        logger.error(f"Error fetching insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary", response_model=InsightsSummaryResponse)
async def get_insights_summary(
    user_id: Optional[str] = Query(None, description="User ID filter")
) -> InsightsSummaryResponse:
    """
    Get summary statistics about insights in the system.
    """
    try:
        result = await insights_processor.get_insights_summary(user_id=user_id)
        return InsightsSummaryResponse(**result)
        
    except Exception as e:
        logger.error(f"Error getting insights summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/insights/{insight_id}/resolve")
async def resolve_insight(
    insight_id: str,
    resolved: bool = True
) -> Dict[str, Any]:
    """
    Mark an insight as resolved or unresolved.
    """
    try:
        result = supabase.table('document_insights')\
            .update({'resolved': resolved})\
            .eq('id', insight_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Insight not found")
        
        return {
            'success': True,
            'insight_id': insight_id,
            'resolved': resolved,
            'updated_at': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error resolving insight {insight_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/insights/{insight_id}/assign")
async def assign_insight(
    insight_id: str,
    assignee: str
) -> Dict[str, Any]:
    """
    Assign an insight to a specific person.
    """
    try:
        result = supabase.table('document_insights')\
            .update({'assignee': assignee})\
            .eq('id', insight_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Insight not found")
        
        return {
            'success': True,
            'insight_id': insight_id,
            'assignee': assignee,
            'updated_at': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error assigning insight {insight_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/insights/{insight_id}")
async def delete_insight(insight_id: str) -> Dict[str, Any]:
    """
    Delete an insight.
    """
    try:
        result = supabase.table('document_insights')\
            .delete()\
            .eq('id', insight_id)\
            .execute()
        
        return {
            'success': True,
            'insight_id': insight_id,
            'deleted_at': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error deleting insight {insight_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for the enhanced insights system.
    """
    try:
        # Test database connection
        result = supabase.table('document_insights').select('id').limit(1).execute()
        
        # Test OpenAI connection
        await openai_client.models.list()
        
        return {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'model': insights_processor.insights_engine.model,
            'database_connected': True,
            'openai_connected': True
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            'status': 'unhealthy',
            'timestamp': datetime.now().isoformat(),
            'error': str(e)
        }
