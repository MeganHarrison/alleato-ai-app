"""
Enhanced Insights Processor

Integration layer that connects the enhanced business insights engine
with the existing RAG pipeline and document processing workflow.
"""

import os
import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

from openai import AsyncOpenAI
from supabase import Client

from .business_insights_engine import BusinessInsightsEngine, EnhancedBusinessInsight

logger = logging.getLogger(__name__)


class EnhancedInsightsProcessor:
    """
    Enhanced processor that integrates sophisticated business insights generation
    with the existing document processing pipeline.
    
    Uses GPT-5 and advanced prompting to generate high-quality, actionable
    business insights that map to the document_insights schema.
    """
    
    def __init__(self, supabase_client: Client, openai_client: AsyncOpenAI = None):
        """
        Initialize the enhanced insights processor.
        
        Args:
            supabase_client: Supabase client for database operations
            openai_client: OpenAI client for LLM operations
        """
        self.supabase = supabase_client
        
        # Initialize OpenAI client if not provided
        if openai_client is None:
            api_key = os.getenv('LLM_API_KEY') or os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("LLM_API_KEY or OPENAI_API_KEY environment variable is required")
            self.openai_client = AsyncOpenAI(api_key=api_key)
        else:
            self.openai_client = openai_client
        
        # Initialize enhanced business insights engine
        self.insights_engine = BusinessInsightsEngine(
            supabase=self.supabase,
            openai_client=self.openai_client
        )
        
        # Configuration
        self.auto_process_insights = os.getenv('AUTO_PROCESS_INSIGHTS', 'true').lower() == 'true'
        self.insights_batch_size = int(os.getenv('INSIGHTS_BATCH_SIZE', '3'))  # Reduced for GPT-5
        self.min_content_length = int(os.getenv('MIN_INSIGHT_CONTENT_LENGTH', '200'))
        
    async def process_document_insights(
        self, 
        document_id: str, 
        content: str, 
        metadata: Dict[str, Any],
        user_id: str = None
    ) -> Dict[str, Any]:
        """
        Process a single document for enhanced business insights extraction.
        
        Args:
            document_id: Document identifier
            content: Document content
            metadata: Document metadata
            user_id: User ID for database operations (optional)
            
        Returns:
            Dict with processing results
        """
        start_time = datetime.now()
        
        try:
            logger.info(f"Processing document {document_id} for enhanced business insights")
            
            # Check if content is substantial enough for insights
            if len(content.strip()) < self.min_content_length:
                logger.info(f"Content too short for insights: {document_id} ({len(content)} chars)")
                return {
                    'document_id': document_id,
                    'insights_found': 0,
                    'insights_saved': 0,
                    'insight_ids': [],
                    'processing_time_seconds': 0,
                    'success': True,
                    'skip_reason': 'content_too_short'
                }
            
            # Check if document has already been processed for insights
            existing_insights = await self._check_existing_insights(document_id)
            if existing_insights:
                logger.info(f"Document {document_id} already has {len(existing_insights)} insights")
                return {
                    'document_id': document_id,
                    'insights_found': len(existing_insights),
                    'insights_saved': 0,
                    'insight_ids': [insight['id'] for insight in existing_insights],
                    'processing_time_seconds': 0,
                    'success': True,
                    'skip_reason': 'already_processed'
                }
            
            # Extract enhanced business insights
            title = metadata.get('title', metadata.get('file_name', f'Document {document_id}'))
            
            result = await self.insights_engine.process_document(
                document_id=document_id,
                content=content,
                title=title,
                metadata=metadata
            )
            
            processing_time = (datetime.now() - start_time).total_seconds()
            result['processing_time_seconds'] = processing_time
            
            # Update document metadata with insights processing info
            if result['success'] and result['insights_saved'] > 0:
                await self._update_document_insights_metadata(
                    document_id=document_id,
                    insight_count=result['insights_saved'],
                    insights_processed_at=datetime.now().isoformat()
                )
            
            logger.info(f"Enhanced insights processing completed for {document_id}: "
                       f"{result['insights_saved']} insights created")
            return result
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            logger.error(f"Failed to process enhanced insights for document {document_id}: {e}")
            
            return {
                'document_id': document_id,
                'insights_found': 0,
                'insights_saved': 0,
                'insight_ids': [],
                'processing_time_seconds': processing_time,
                'success': False,
                'error': str(e)
            }
    
    async def process_batch_insights(
        self, 
        documents: List[Dict[str, Any]], 
        user_id: str = None
    ) -> Dict[str, Any]:
        """
        Process multiple documents for enhanced insights in batch.
        
        Args:
            documents: List of document dictionaries with id, content, metadata
            user_id: User ID for database operations
            
        Returns:
            Batch processing results
        """
        start_time = datetime.now()
        batch_results = []
        total_insights = 0
        
        logger.info(f"Processing batch of {len(documents)} documents for enhanced insights")
        
        # Process documents with concurrency control (GPT-5 is more expensive)
        semaphore = asyncio.Semaphore(self.insights_batch_size)
        
        async def process_single_doc(doc):
            async with semaphore:
                return await self.process_document_insights(
                    document_id=doc['id'],
                    content=doc.get('content', ''),
                    metadata=doc.get('metadata', {}),
                    user_id=user_id
                )
        
        # Process all documents
        tasks = [process_single_doc(doc) for doc in documents]
        batch_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Compile results
        successful_results = []
        failed_results = []
        skipped_results = []
        
        for result in batch_results:
            if isinstance(result, Exception):
                failed_results.append({
                    'error': str(result),
                    'success': False
                })
            elif result.get('success', False):
                if result.get('skip_reason'):
                    skipped_results.append(result)
                else:
                    successful_results.append(result)
                    total_insights += result.get('insights_saved', 0)
            else:
                failed_results.append(result)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        batch_summary = {
            'total_documents': len(documents),
            'successful_documents': len(successful_results),
            'skipped_documents': len(skipped_results),
            'failed_documents': len(failed_results),
            'total_insights_created': total_insights,
            'processing_time_seconds': processing_time,
            'average_insights_per_doc': total_insights / max(len(successful_results), 1),
            'results': successful_results,
            'skipped': skipped_results,
            'errors': failed_results
        }
        
        logger.info(f"Enhanced batch insights processing completed: "
                   f"{len(successful_results)}/{len(documents)} documents processed, "
                   f"{total_insights} insights created")
        
        return batch_summary
    
    async def process_pending_insights_queue(self, user_id: str = None) -> Dict[str, Any]:
        """
        Process documents in the insights processing queue.
        
        Only processes documents that don't already have insights to avoid duplication.
        
        Args:
            user_id: Optional user ID filter
            
        Returns:
            Processing results
        """
        try:
            logger.info("Starting enhanced insights queue processing")
            
            # Get all documents
            query = self.supabase.table('documents').select('*')
            if user_id:
                query = query.eq('user_id', user_id)
            
            result = query.execute()
            
            if not result.data:
                logger.info("No documents found for insights processing")
                return {
                    'documents_processed': 0,
                    'insights_created': 0,
                    'processing_time_seconds': 0
                }
            
            # Get documents that already have insights
            processed_docs_result = self.supabase.table('document_insights')\
                .select('document_id')\
                .execute()
            
            processed_doc_ids = set()
            if processed_docs_result.data:
                processed_doc_ids = {doc['document_id'] for doc in processed_docs_result.data 
                                   if doc['document_id']}
            
            # Filter out already processed documents
            unprocessed_documents = [
                doc for doc in result.data 
                if doc['id'] not in processed_doc_ids
            ]
            
            if not unprocessed_documents:
                logger.info("No unprocessed documents found for insights processing")
                return {
                    'documents_processed': 0,
                    'insights_created': 0,
                    'processing_time_seconds': 0
                }
            
            # Filter documents by content quality for insights
            quality_documents = []
            for doc in unprocessed_documents:
                content = doc.get('content', '')
                if (len(content.strip()) >= self.min_content_length and
                    self.should_process_for_insights(doc.get('metadata', {}))):
                    quality_documents.append(doc)
            
            if not quality_documents:
                logger.info("No quality documents found for insights processing")
                return {
                    'documents_processed': 0,
                    'insights_created': 0,
                    'processing_time_seconds': 0
                }
            
            logger.info(f"Found {len(quality_documents)} quality documents for insights processing")
            
            # Process the documents
            fallback_user = user_id or 'system'
            batch_results = await self.process_batch_insights(quality_documents, fallback_user)
            
            return batch_results
            
        except Exception as e:
            logger.error(f"Failed to process pending insights queue: {e}")
            return {
                'documents_processed': 0,
                'insights_created': 0,
                'processing_time_seconds': 0,
                'error': str(e)
            }
    
    async def trigger_insights_for_document(
        self, 
        document_id: str, 
        user_id: str = None,
        force_reprocess: bool = False
    ) -> Dict[str, Any]:
        """
        Manually trigger enhanced insights processing for a specific document.
        
        Args:
            document_id: Document to process
            user_id: Optional user ID for filtering
            force_reprocess: If True, reprocess even if insights already exist
            
        Returns:
            Processing results
        """
        try:
            # Get document details
            query = self.supabase.table('documents').select('*').eq('id', document_id)
            if user_id:
                query = query.eq('user_id', user_id)
            
            result = query.single().execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': f'Document {document_id} not found'
                }
            
            document = result.data
            
            # Check for existing insights unless force reprocessing
            if not force_reprocess:
                existing_insights = await self._check_existing_insights(document_id)
                if existing_insights:
                    return {
                        'success': True,
                        'document_id': document_id,
                        'insights_found': len(existing_insights),
                        'insights_saved': 0,
                        'insight_ids': [insight['id'] for insight in existing_insights],
                        'processing_time_seconds': 0,
                        'skip_reason': 'already_processed'
                    }
            else:
                # Delete existing insights if force reprocessing
                await self._delete_existing_insights(document_id)
            
            # Process the document
            processing_result = await self.process_document_insights(
                document_id=document_id,
                content=document.get('content', ''),
                metadata=document.get('metadata', {}),
                user_id=document.get('user_id')
            )
            
            return processing_result
            
        except Exception as e:
            logger.error(f"Failed to manually trigger insights for document {document_id}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def should_process_for_insights(self, metadata: Dict[str, Any]) -> bool:
        """
        Determine if a document should be processed for enhanced insights.
        
        Args:
            metadata: Document metadata
            
        Returns:
            True if insights should be processed
        """
        # Check if auto-processing is enabled
        if not self.auto_process_insights:
            return False
        
        # Check file type - focus on text-based business documents
        file_type = metadata.get('file_type', '').lower()
        supported_types = ['txt', 'md', 'docx', 'pdf', 'json', 'html']
        
        if file_type not in supported_types:
            return False
        
        # Check content length
        content_length = metadata.get('content_length', 0)
        if content_length < self.min_content_length:
            return False
        
        # Skip certain document types that are unlikely to have business insights
        title = metadata.get('title', '').lower()
        skip_patterns = [
            'readme', 'license', 'changelog', 'config', 'setup',
            'requirements', '.env', 'package.json', 'yarn.lock'
        ]
        
        if any(pattern in title for pattern in skip_patterns):
            return False
        
        return True
    
    async def _check_existing_insights(self, document_id: str) -> List[Dict[str, Any]]:
        """Check if document already has insights."""
        try:
            result = self.supabase.table('document_insights')\
                .select('*')\
                .eq('document_id', document_id)\
                .execute()
            
            return result.data or []
        except Exception as e:
            logger.warning(f"Failed to check existing insights for {document_id}: {e}")
            return []
    
    async def _delete_existing_insights(self, document_id: str):
        """Delete existing insights for a document."""
        try:
            self.supabase.table('document_insights')\
                .delete()\
                .eq('document_id', document_id)\
                .execute()
            logger.info(f"Deleted existing insights for document {document_id}")
        except Exception as e:
            logger.warning(f"Failed to delete existing insights for {document_id}: {e}")
    
    async def _update_document_insights_metadata(
        self, 
        document_id: str, 
        insight_count: int, 
        insights_processed_at: str
    ):
        """Update document metadata with insights processing information."""
        try:
            # Try to update documents table (may not have these columns)
            self.supabase.table('documents').update({
                'insights_count': insight_count,
                'insights_processed_at': insights_processed_at,
                'insights_needs_reprocessing': False
            }).eq('id', document_id).execute()
            
        except Exception as e:
            # This is not critical, so just log a warning
            logger.debug(f"Could not update document {document_id} insights metadata: {e}")
    
    async def get_insights_summary(self, user_id: str = None) -> Dict[str, Any]:
        """Get summary statistics about insights in the system."""
        try:
            # Get total insights count
            query = self.supabase.table('document_insights').select('*', count='exact')
            if user_id:
                # Filter by documents owned by user (requires join)
                pass  # Complex query, skip user filtering for now
            
            result = query.execute()
            total_insights = result.count or 0
            
            # Get insights by type
            insights_by_type = {}
            insights_by_severity = {}
            
            if result.data:
                for insight in result.data:
                    # Count by type
                    insight_type = insight.get('insight_type', 'unknown')
                    insights_by_type[insight_type] = insights_by_type.get(insight_type, 0) + 1
                    
                    # Count by severity
                    severity = insight.get('severity', 'unknown')
                    insights_by_severity[severity] = insights_by_severity.get(severity, 0) + 1
            
            # Get recent insights (last 7 days)
            week_ago = (datetime.now() - timedelta(days=7)).isoformat()
            recent_result = self.supabase.table('document_insights')\
                .select('*', count='exact')\
                .gte('created_at', week_ago)\
                .execute()
            
            recent_insights = recent_result.count or 0
            
            return {
                'total_insights': total_insights,
                'recent_insights_7_days': recent_insights,
                'insights_by_type': insights_by_type,
                'insights_by_severity': insights_by_severity,
                'most_common_type': max(insights_by_type.items(), key=lambda x: x[1])[0] if insights_by_type else None,
                'critical_insights': insights_by_severity.get('critical', 0),
                'high_priority_insights': insights_by_severity.get('high', 0)
            }
            
        except Exception as e:
            logger.error(f"Failed to get insights summary: {e}")
            return {
                'total_insights': 0,
                'recent_insights_7_days': 0,
                'insights_by_type': {},
                'insights_by_severity': {},
                'error': str(e)
            }
