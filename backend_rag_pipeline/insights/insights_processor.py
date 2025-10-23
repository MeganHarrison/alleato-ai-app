"""
Insights Processor for RAG Pipeline Integration

Integrates insights generation with the document processing pipeline,
automatically extracting insights when documents are processed.
"""

import os
import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime

from openai import AsyncOpenAI
from supabase import Client

from .insights_service import MeetingInsightsGenerator

logger = logging.getLogger(__name__)


class InsightsProcessor:
    """
    Processes documents for insights generation as part of the RAG pipeline.
    Integrates with the existing document processing workflow.
    """
    
    def __init__(self, supabase_client: Client, openai_client: AsyncOpenAI = None):
        """
        Initialize the insights processor.
        
        Args:
            supabase_client: Supabase client for database operations
            openai_client: OpenAI client for LLM operations
        """
        self.supabase = supabase_client
        
        # Initialize OpenAI client if not provided
        if openai_client is None:
            api_key = os.getenv('OPENAI_API_KEY') or os.getenv('LLM_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY or LLM_API_KEY environment variable is required")
            self.openai_client = AsyncOpenAI(api_key=api_key)
        else:
            self.openai_client = openai_client
        
        # Initialize insights generator
        self.insights_generator = MeetingInsightsGenerator(
            supabase=self.supabase,
            openai_client=self.openai_client
        )
        
        # Configuration
        self.auto_process_insights = os.getenv('AUTO_PROCESS_INSIGHTS', 'true').lower() == 'true'
        self.insights_batch_size = int(os.getenv('INSIGHTS_BATCH_SIZE', '5'))
        
    async def process_document_insights(
        self, 
        document_id: str, 
        content: str, 
        metadata: Dict[str, Any],
        user_id: str
    ) -> Dict[str, Any]:
        """
        Process a single document for insights extraction.
        
        Args:
            document_id: Document identifier
            content: Document content
            metadata: Document metadata
            user_id: User ID for database operations
            
        Returns:
            Dict with processing results
        """
        start_time = datetime.now()
        
        try:
            logger.info(f"Processing document {document_id} for insights")
            
            # Extract insights from the document
            insights = await self.insights_generator.extract_insights_from_meeting(
                document_id=document_id,
                title=metadata.get('title', f'Document {document_id}'),
                content=content,
                metadata=metadata
            )
            
            # Save insights if any were found
            created_insight_ids = []
            if insights:
                created_insight_ids = await self.insights_generator.save_insights_to_database(
                    insights=insights,
                    user_id=user_id
                )
                
                # Update document metadata with insights info
                await self._update_document_insights_metadata(
                    document_id=document_id,
                    insight_count=len(created_insight_ids),
                    insights_processed_at=datetime.now().isoformat()
                )
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            result = {
                'document_id': document_id,
                'insights_found': len(insights),
                'insights_saved': len(created_insight_ids),
                'insight_ids': created_insight_ids,
                'processing_time_seconds': processing_time,
                'success': True
            }
            
            logger.info(f"Insights processing completed for {document_id}: {len(insights)} insights found")
            return result
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            logger.error(f"Failed to process insights for document {document_id}: {e}")
            
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
        user_id: str
    ) -> Dict[str, Any]:
        """
        Process multiple documents for insights in batch.
        
        Args:
            documents: List of document dictionaries with id, content, metadata
            user_id: User ID for database operations
            
        Returns:
            Batch processing results
        """
        start_time = datetime.now()
        batch_results = []
        total_insights = 0
        
        logger.info(f"Processing batch of {len(documents)} documents for insights")
        
        # Process documents concurrently but with a limit
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
        
        for result in batch_results:
            if isinstance(result, Exception):
                failed_results.append({
                    'error': str(result),
                    'success': False
                })
            elif result.get('success', False):
                successful_results.append(result)
                total_insights += result.get('insights_saved', 0)
            else:
                failed_results.append(result)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        batch_summary = {
            'total_documents': len(documents),
            'successful_documents': len(successful_results),
            'failed_documents': len(failed_results),
            'total_insights_created': total_insights,
            'processing_time_seconds': processing_time,
            'results': successful_results,
            'errors': failed_results
        }
        
        logger.info(f"Batch insights processing completed: {len(successful_results)}/{len(documents)} documents processed, {total_insights} insights created")
        
        return batch_summary
    
    async def process_pending_insights_queue(self, user_id: str = None) -> Dict[str, Any]:
        """
        Process documents in the insights processing queue.
        
        Args:
            user_id: Optional user ID filter
            
        Returns:
            Processing results
        """
        try:
            # Get documents pending insights processing
            query = self.supabase.table('documents').select('*')
            
            # Filter by user if specified
            if user_id:
                query = query.eq('user_id', user_id)
            
            # Get all documents since we can't rely on insights_processed_at column
            # We'll filter out already processed ones in the logic
            
            result = query.execute()
            
            if not result.data:
                logger.info("No documents found for insights processing")
                return {
                    'documents_processed': 0,
                    'insights_created': 0,
                    'processing_time_seconds': 0
                }
            
            # Get already processed document IDs
            processed_docs = self.supabase.table('ai_insights')\
                .select('document_id')\
                .execute()
            
            processed_doc_ids = set()
            if processed_docs.data:
                processed_doc_ids = {doc['document_id'] for doc in processed_docs.data if doc['document_id']}
            
            # Filter out already processed documents
            unprocessed_documents = [doc for doc in result.data if doc['id'] not in processed_doc_ids]
            
            if not unprocessed_documents:
                logger.info("No unprocessed documents found for insights processing")
                return {
                    'documents_processed': 0,
                    'insights_created': 0,
                    'processing_time_seconds': 0
                }
            
            documents = unprocessed_documents
            logger.info(f"Found {len(documents)} unprocessed documents for insights processing")
            
            # Process the documents - handle missing user_id gracefully
            fallback_user = user_id or (documents[0].get('created_by') if documents and documents[0].get('created_by') else 'system')
            batch_results = await self.process_batch_insights(documents, fallback_user)
            
            return batch_results
            
        except Exception as e:
            logger.error(f"Failed to process pending insights queue: {e}")
            return {
                'documents_processed': 0,
                'insights_created': 0,
                'processing_time_seconds': 0,
                'error': str(e)
            }
    
    async def _update_document_insights_metadata(
        self, 
        document_id: str, 
        insight_count: int, 
        insights_processed_at: str
    ):
        """Update document metadata with insights processing information."""
        try:
            self.supabase.table('documents').update({
                'insights_count': insight_count,
                'insights_processed_at': insights_processed_at,
                'insights_needs_reprocessing': False
            }).eq('id', document_id).execute()
            
        except Exception as e:
            logger.warning(f"Failed to update document {document_id} insights metadata: {e}")
    
    async def trigger_insights_for_document(self, document_id: str, user_id: str = None) -> Dict[str, Any]:
        """
        Manually trigger insights processing for a specific document.
        
        Args:
            document_id: Document to process
            user_id: Optional user ID for filtering
            
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
            
            # Process the document
            processing_result = await self.process_document_insights(
                document_id=document_id,
                content=document.get('content', ''),
                metadata=document.get('metadata', {}),
                user_id=document['user_id']
            )
            
            return processing_result
            
        except Exception as e:
            logger.error(f"Failed to manually trigger insights for document {document_id}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def should_process_insights(self, metadata: Dict[str, Any]) -> bool:
        """
        Determine if a document should be processed for insights.
        
        Args:
            metadata: Document metadata
            
        Returns:
            True if insights should be processed
        """
        # Check if auto-processing is enabled
        if not self.auto_process_insights:
            return False
        
        # Check file type - focus on text-based documents
        file_type = metadata.get('file_type', '').lower()
        supported_types = ['txt', 'md', 'docx', 'pdf', 'json']
        
        if file_type not in supported_types:
            return False
        
        # Check content length - avoid processing very short documents
        content_length = metadata.get('content_length', 0)
        if content_length < 100:  # Minimum 100 characters
            return False
        
        return True