"""
Insights Trigger Manager

Manages different ways to trigger insights processing:
- Automatic triggers after document processing
- Manual triggers via API endpoints
- Webhook triggers for external systems
"""

import os
import logging
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from pydantic import BaseModel
import hmac
import hashlib

from supabase import Client
from openai import AsyncOpenAI

from .insights_processor import InsightsProcessor

logger = logging.getLogger(__name__)


class InsightsTriggerRequest(BaseModel):
    """Request model for manual insights triggering."""
    document_ids: Optional[List[str]] = None
    user_id: Optional[str] = None
    force_reprocess: bool = False


class WebhookInsightsRequest(BaseModel):
    """Request model for webhook insights triggering."""
    trigger_type: str
    document_id: Optional[str] = None
    user_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class InsightsTriggerManager:
    """
    Manages insights processing triggers and provides API endpoints.
    """
    
    def __init__(self, app: FastAPI, supabase_client: Client):
        """
        Initialize the triggers manager.
        
        Args:
            app: FastAPI application instance
            supabase_client: Supabase client for database operations
        """
        self.app = app
        self.supabase = supabase_client
        
        # Initialize OpenAI client
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            logger.warning("OPENAI_API_KEY not found - insights functionality will be disabled")
            self.openai_client = None
            self.insights_processor = None
        else:
            self.openai_client = AsyncOpenAI(api_key=api_key)
            self.insights_processor = InsightsProcessor(
                supabase_client=self.supabase,
                openai_client=self.openai_client
            )
        
        # Webhook configuration
        self.webhook_secret = os.getenv('INSIGHTS_WEBHOOK_SECRET')
        
        # Register endpoints
        self._register_endpoints()
    
    def _register_endpoints(self):
        """Register insights-related API endpoints."""
        
        @self.app.post("/insights/trigger")
        async def trigger_insights_manual(
            request: InsightsTriggerRequest,
            background_tasks: BackgroundTasks
        ):
            """Manually trigger insights processing."""
            if not self.insights_processor:
                raise HTTPException(status_code=503, detail="Insights service not available")
            
            # Add task to background processing
            background_tasks.add_task(
                self._process_insights_background,
                request.document_ids,
                request.user_id,
                request.force_reprocess
            )
            
            return {
                "message": "Insights processing started",
                "document_ids": request.document_ids,
                "user_id": request.user_id,
                "timestamp": datetime.now().isoformat()
            }
        
        @self.app.post("/insights/webhook")
        async def webhook_insights_trigger(
            request: WebhookInsightsRequest,
            fastapi_request: Request,
            background_tasks: BackgroundTasks
        ):
            """Webhook endpoint for external insights triggers."""
            if not self.insights_processor:
                raise HTTPException(status_code=503, detail="Insights service not available")
            
            # Verify webhook signature if secret is configured
            if self.webhook_secret:
                if not self._verify_webhook_signature(fastapi_request, self.webhook_secret):
                    raise HTTPException(status_code=401, detail="Invalid webhook signature")
            
            # Process webhook trigger
            background_tasks.add_task(
                self._process_webhook_insights,
                request.trigger_type,
                request.document_id,
                request.user_id,
                request.metadata or {}
            )
            
            return {
                "message": "Webhook insights processing started",
                "trigger_type": request.trigger_type,
                "timestamp": datetime.now().isoformat()
            }
        
        @self.app.get("/insights/status")
        async def get_insights_status():
            """Get insights processing status."""
            try:
                # Get recent insights statistics
                recent_insights = self.supabase.table('insights')\
                    .select('*')\
                    .gte('created_at', (datetime.now().replace(hour=0, minute=0, second=0)).isoformat())\
                    .execute()
                
                # Get documents pending processing
                pending_docs = self.supabase.table('documents')\
                    .select('id')\
                    .is_('insights_processed_at', 'null')\
                    .execute()
                
                return {
                    "service_available": self.insights_processor is not None,
                    "insights_today": len(recent_insights.data) if recent_insights.data else 0,
                    "documents_pending": len(pending_docs.data) if pending_docs.data else 0,
                    "timestamp": datetime.now().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Failed to get insights status: {e}")
                raise HTTPException(status_code=500, detail="Failed to get insights status")
    
    async def _process_insights_background(
        self, 
        document_ids: Optional[List[str]], 
        user_id: Optional[str],
        force_reprocess: bool
    ):
        """Background task for processing insights."""
        try:
            if document_ids:
                # Process specific documents
                for doc_id in document_ids:
                    if force_reprocess:
                        # Mark document for reprocessing
                        self.supabase.table('documents')\
                            .update({'insights_needs_reprocessing': True})\
                            .eq('id', doc_id)\
                            .execute()
                    
                    result = await self.insights_processor.trigger_insights_for_document(
                        document_id=doc_id,
                        user_id=user_id
                    )
                    logger.info(f"Processed insights for document {doc_id}: {result}")
            else:
                # Process pending insights queue
                result = await self.insights_processor.process_pending_insights_queue(user_id)
                logger.info(f"Processed pending insights queue: {result}")
                
        except Exception as e:
            logger.error(f"Background insights processing failed: {e}")
    
    async def _process_webhook_insights(
        self,
        trigger_type: str,
        document_id: Optional[str],
        user_id: Optional[str],
        metadata: Dict[str, Any]
    ):
        """Background task for processing webhook insights."""
        try:
            logger.info(f"Processing webhook insights trigger: {trigger_type}")
            
            if trigger_type == "document_processed" and document_id:
                # Process specific document
                result = await self.insights_processor.trigger_insights_for_document(
                    document_id=document_id,
                    user_id=user_id
                )
                logger.info(f"Webhook processed insights for document {document_id}: {result}")
                
            elif trigger_type == "batch_process":
                # Process pending queue
                result = await self.insights_processor.process_pending_insights_queue(user_id)
                logger.info(f"Webhook processed pending insights: {result}")
                
            else:
                logger.warning(f"Unknown webhook trigger type: {trigger_type}")
                
        except Exception as e:
            logger.error(f"Webhook insights processing failed: {e}")
    
    def _verify_webhook_signature(self, request: Request, secret: str) -> bool:
        """Verify webhook signature for security."""
        try:
            # Get signature from header
            signature = request.headers.get('X-Webhook-Signature')
            if not signature:
                return False
            
            # Get request body
            body = request.body()
            
            # Calculate expected signature
            expected_signature = hmac.new(
                secret.encode('utf-8'),
                body,
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            return hmac.compare_digest(signature, f"sha256={expected_signature}")
            
        except Exception as e:
            logger.error(f"Failed to verify webhook signature: {e}")
            return False
    
    async def trigger_insights_after_document_processing(
        self,
        document_id: str,
        content: str,
        metadata: Dict[str, Any],
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Automatically trigger insights processing after document processing.
        This is called by the RAG pipeline after a document is processed.
        
        Args:
            document_id: Processed document ID
            content: Document content
            metadata: Document metadata
            user_id: User ID
            
        Returns:
            Insights processing results or None if not processed
        """
        if not self.insights_processor:
            logger.warning("Insights processor not available")
            return None
        
        try:
            # Check if document should be processed for insights
            if not self.insights_processor.should_process_insights(metadata):
                logger.debug(f"Document {document_id} skipped for insights processing")
                return None
            
            # Process insights
            result = await self.insights_processor.process_document_insights(
                document_id=document_id,
                content=content,
                metadata=metadata,
                user_id=user_id
            )
            
            logger.info(f"Auto-processed insights for document {document_id}: {result.get('insights_saved', 0)} insights created")
            return result
            
        except Exception as e:
            logger.error(f"Failed to auto-process insights for document {document_id}: {e}")
            return None


# Utility function to integrate with existing RAG pipeline
async def integrate_insights_with_text_processor(
    trigger_manager: InsightsTriggerManager,
    document_id: str,
    content: str,
    metadata: Dict[str, Any],
    user_id: str
) -> Optional[Dict[str, Any]]:
    """
    Integration point for the text processor to trigger insights.
    
    Args:
        trigger_manager: Insights trigger manager instance
        document_id: Document ID
        content: Document content
        metadata: Document metadata
        user_id: User ID
        
    Returns:
        Insights processing results or None
    """
    return await trigger_manager.trigger_insights_after_document_processing(
        document_id=document_id,
        content=content,
        metadata=metadata,
        user_id=user_id
    )