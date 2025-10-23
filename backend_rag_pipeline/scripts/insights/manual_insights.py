#!/usr/bin/env python3
"""
Manual Insights Generation Script

A standalone script for manually triggering insights processing.
Can be run from command line or scheduled as a cron job.

Usage:
    python manual_insights.py --help
    python manual_insights.py --process-pending
    python manual_insights.py --document-id <id> --user-id <id>
    python manual_insights.py --batch --user-id <id>
"""

import os
import sys
import argparse
import asyncio
import logging
from typing import Optional, List
from datetime import datetime
from pathlib import Path

# Add paths for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'common'))

# Set up environment
from dotenv import load_dotenv

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

# Import insights processor
try:
    from insights.insights_processor import InsightsProcessor
    from openai import AsyncOpenAI
    from supabase import create_client
    INSIGHTS_AVAILABLE = True
except ImportError as e:
    print(f"Error: Failed to import insights modules: {e}")
    print("Make sure all dependencies are installed and the module structure is correct.")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ManualInsightsProcessor:
    """Manual insights processing interface."""
    
    def __init__(self):
        """Initialize the manual insights processor."""
        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required")
        
        self.supabase = create_client(supabase_url, supabase_key)
        
        # Initialize OpenAI client
        openai_api_key = os.getenv('OPENAI_API_KEY') or os.getenv('LLM_API_KEY')
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY or LLM_API_KEY environment variable is required")
        
        self.openai_client = AsyncOpenAI(api_key=openai_api_key)
        
        # Initialize insights processor
        self.insights_processor = InsightsProcessor(
            supabase_client=self.supabase,
            openai_client=self.openai_client
        )
        
        logger.info("Manual insights processor initialized successfully")
    
    async def process_pending_insights(self, user_id: Optional[str] = None) -> dict:
        """Process all documents pending insights processing."""
        logger.info(f"Processing pending insights for user: {user_id or 'all users'}")
        
        try:
            result = await self.insights_processor.process_pending_insights_queue(user_id)
            
            logger.info(f"Pending insights processing completed:")
            logger.info(f"  - Documents processed: {result.get('successful_documents', 0)}")
            logger.info(f"  - Documents failed: {result.get('failed_documents', 0)}")
            logger.info(f"  - Total insights created: {result.get('total_insights_created', 0)}")
            logger.info(f"  - Processing time: {result.get('processing_time_seconds', 0):.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to process pending insights: {e}")
            return {'error': str(e), 'success': False}
    
    async def process_document_insights(self, document_id: str, user_id: Optional[str] = None) -> dict:
        """Process insights for a specific document."""
        logger.info(f"Processing insights for document: {document_id}")
        
        try:
            result = await self.insights_processor.trigger_insights_for_document(
                document_id=document_id,
                user_id=user_id
            )
            
            if result.get('success', False):
                logger.info(f"Document insights processing completed:")
                logger.info(f"  - Insights found: {result.get('insights_found', 0)}")
                logger.info(f"  - Insights saved: {result.get('insights_saved', 0)}")
                logger.info(f"  - Processing time: {result.get('processing_time_seconds', 0):.2f}s")
            else:
                logger.error(f"Document insights processing failed: {result.get('error', 'Unknown error')}")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to process document insights: {e}")
            return {'error': str(e), 'success': False}
    
    async def process_batch_insights(self, document_ids: List[str], user_id: Optional[str] = None) -> dict:
        """Process insights for a batch of documents."""
        logger.info(f"Processing insights for {len(document_ids)} documents")
        
        try:
            # Get document details
            documents = []
            for doc_id in document_ids:
                doc_result = self.supabase.table('documents').select('*').eq('id', doc_id).execute()
                if doc_result.data:
                    documents.append({
                        'id': doc_id,
                        'content': doc_result.data[0].get('content', ''),
                        'metadata': doc_result.data[0].get('metadata', {})
                    })
                else:
                    logger.warning(f"Document {doc_id} not found")
            
            if not documents:
                logger.warning("No valid documents found for processing")
                return {'error': 'No valid documents found', 'success': False}
            
            # Process the batch
            result = await self.insights_processor.process_batch_insights(
                documents=documents,
                user_id=user_id or documents[0].get('user_id', 'unknown')
            )
            
            logger.info(f"Batch insights processing completed:")
            logger.info(f"  - Documents processed: {result.get('successful_documents', 0)}")
            logger.info(f"  - Documents failed: {result.get('failed_documents', 0)}")
            logger.info(f"  - Total insights created: {result.get('total_insights_created', 0)}")
            logger.info(f"  - Processing time: {result.get('processing_time_seconds', 0):.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to process batch insights: {e}")
            return {'error': str(e), 'success': False}
    
    def get_insights_status(self) -> dict:
        """Get current insights processing status."""
        try:
            # Get insights count for today
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            insights_today = self.supabase.table('ai_insights')\
                .select('id', count='exact')\
                .gte('created_at', today.isoformat())\
                .execute()
            
            # Get total insights
            total_insights = self.supabase.table('ai_insights')\
                .select('id', count='exact')\
                .execute()
            
            # Get documents that don't have insights yet
            # First get all document IDs
            all_docs = self.supabase.table('documents')\
                .select('id')\
                .execute()
            
            # Get document IDs that already have insights
            processed_docs = self.supabase.table('ai_insights')\
                .select('document_id')\
                .execute()
            
            processed_doc_ids = set()
            if processed_docs.data:
                processed_doc_ids = {doc['document_id'] for doc in processed_docs.data if doc['document_id']}
            
            # Calculate pending count
            total_docs = len(all_docs.data) if all_docs.data else 0
            pending_count = total_docs - len(processed_doc_ids)
            
            # Create mock result for compatibility
            pending_docs = type('MockResult', (), {'count': pending_count})()
            
            status = {
                'insights_today': insights_today.count or 0,
                'total_insights': total_insights.count or 0,
                'documents_pending': pending_docs.count or 0,
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info("Current insights status:")
            logger.info(f"  - Insights today: {status['insights_today']}")
            logger.info(f"  - Total insights: {status['total_insights']}")
            logger.info(f"  - Documents pending: {status['documents_pending']}")
            
            return status
            
        except Exception as e:
            logger.error(f"Failed to get insights status: {e}")
            return {'error': str(e)}


async def main():
    """Main function for command line interface."""
    parser = argparse.ArgumentParser(description="Manual Insights Generation Script")
    
    # Command options
    command_group = parser.add_mutually_exclusive_group(required=True)
    command_group.add_argument('--process-pending', action='store_true',
                              help='Process all documents pending insights processing')
    command_group.add_argument('--document-id', type=str,
                              help='Process insights for a specific document ID')
    command_group.add_argument('--batch', action='store_true',
                              help='Process insights for multiple document IDs (use with --document-ids)')
    command_group.add_argument('--status', action='store_true',
                              help='Show current insights processing status')
    
    # Additional options
    parser.add_argument('--user-id', type=str,
                       help='Filter processing by user ID')
    parser.add_argument('--document-ids', type=str, nargs='+',
                       help='List of document IDs for batch processing')
    parser.add_argument('--verbose', '-v', action='store_true',
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        # Initialize processor
        processor = ManualInsightsProcessor()
        
        # Execute command
        if args.status:
            status = processor.get_insights_status()
            if 'error' in status:
                print(f"Error getting status: {status['error']}")
                sys.exit(1)
            
        elif args.process_pending:
            result = await processor.process_pending_insights(args.user_id)
            if not result.get('success', True):
                print(f"Error processing pending insights: {result.get('error', 'Unknown error')}")
                sys.exit(1)
            
        elif args.document_id:
            result = await processor.process_document_insights(args.document_id, args.user_id)
            if not result.get('success', False):
                print(f"Error processing document insights: {result.get('error', 'Unknown error')}")
                sys.exit(1)
            
        elif args.batch:
            if not args.document_ids:
                print("Error: --document-ids required when using --batch")
                sys.exit(1)
            
            result = await processor.process_batch_insights(args.document_ids, args.user_id)
            if not result.get('success', True):
                print(f"Error processing batch insights: {result.get('error', 'Unknown error')}")
                sys.exit(1)
        
        logger.info("Manual insights processing completed successfully")
        
    except KeyboardInterrupt:
        logger.info("Processing interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())