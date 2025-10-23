#!/usr/bin/env python3
"""
Process Recent Documents Without Insights (Last 3 Months)

Finds documents in document_metadata table from the last 3 months 
that don't have insights yet and processes them with the enhanced engine.
"""

import os
import sys
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

# Load environment variables
load_dotenv()

async def process_recent_insights():
    """Process documents from last 3 months that don't have insights yet."""
    
    try:
        from insights.enhanced.business_insights_engine import BusinessInsightsEngine
        from supabase import create_client
        from openai import AsyncOpenAI
        
        print("🗓️  **PROCESSING RECENT DOCUMENTS (LAST 3 MONTHS)**")
        print("=" * 70)
        
        # Calculate 3 months ago date - September 2025, so last 3 months = June 2025 onwards
        # Use June 1st, 2025 as the cutoff for "last 3 months"
        three_months_ago = datetime(2025, 6, 1)
        cutoff_date = three_months_ago.strftime('%Y-%m-%d')
        
        print(f"📅 **Date Filter:** Documents from {cutoff_date} onwards (June 2025 - September 2025)")
        
        # Initialize clients
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Initialize enhanced insights engine
        engine = BusinessInsightsEngine(
            supabase=supabase,
            openai_client=openai_client
        )
        
        print("✅ Initialized Enhanced Business Insights Engine")
        
        # Get recent documents from document_metadata table
        print(f"\n📊 **Analyzing recent document_metadata...**")
        
        # First, get all documents (we'll filter by created date from documents table)
        docs_result = supabase.table('document_metadata')\
            .select('id, title, url')\
            .execute()
        
        if not docs_result.data:
            print("❌ No documents found in document_metadata table")
            return
        
        # Get creation dates from documents table (using created_at or file timestamps)
        print(f"🔍 **Filtering by creation date...**")
        
        recent_docs = []
        for doc in docs_result.data:
            doc_id = doc['id']
            
            # Check if document chunks exist and when they were created
            content_result = supabase.table('documents')\
                .select('metadata, created_at')\
                .eq('file_id', doc_id)\
                .limit(1)\
                .execute()
            
            if content_result.data:
                # Use created_at from documents table, or extract from metadata
                chunk = content_result.data[0]
                
                # Try to get date from created_at field
                doc_date = None
                if chunk.get('created_at'):
                    try:
                        doc_date = datetime.fromisoformat(chunk['created_at'].replace('Z', '+00:00'))
                    except:
                        pass
                
                # Fallback: check if metadata has date info
                if not doc_date and chunk.get('metadata'):
                    metadata = chunk['metadata']
                    # Look for any date-related fields
                    for field in ['processed_at', 'created_at', 'modified_time']:
                        if field in metadata:
                            try:
                                doc_date = datetime.fromisoformat(str(metadata[field]).replace('Z', '+00:00'))
                                break
                            except:
                                continue
                
                # If we found a date and it's within last 3 months, include it
                if doc_date and doc_date >= three_months_ago:
                    doc['doc_date'] = doc_date
                    recent_docs.append(doc)
                elif not doc_date:
                    # If no date found, include it (assume it might be recent)
                    print(f"   ⚠️  No date found for {doc['title'][:40]}... - including anyway")
                    doc['doc_date'] = None
                    recent_docs.append(doc)
        
        # Get all document IDs that already have insights
        insights_result = supabase.table('document_insights')\
            .select('document_id')\
            .execute()
        
        processed_doc_ids = set()
        if insights_result.data:
            processed_doc_ids = {insight['document_id'] for insight in insights_result.data}
        
        # Find recent documents without insights
        unprocessed_recent_docs = []
        for doc in recent_docs:
            if doc['id'] not in processed_doc_ids:
                unprocessed_recent_docs.append(doc)
        
        print(f"\n📈 **Recent Documents Analysis:**")
        print(f"   Total documents in metadata: {len(docs_result.data)}")
        print(f"   Recent documents (last 3 months): {len(recent_docs)}")
        print(f"   Recent docs with insights: {len(recent_docs) - len(unprocessed_recent_docs)}")
        print(f"   Recent docs WITHOUT insights: {len(unprocessed_recent_docs)}")
        
        if not unprocessed_recent_docs:
            print("\n✅ All recent documents already have insights!")
            return
        
        # Show some examples of unprocessed recent documents
        print(f"\n📋 **Recent Documents Missing Insights:**")
        for i, doc in enumerate(unprocessed_recent_docs[:10]):
            title = doc['title'][:50] + "..." if len(doc['title']) > 50 else doc['title']
            date_str = doc['doc_date'].strftime('%Y-%m-%d') if doc['doc_date'] else 'Unknown date'
            print(f"   {i+1}. [{date_str}] {title}")
        
        if len(unprocessed_recent_docs) > 10:
            print(f"   ... and {len(unprocessed_recent_docs) - 10} more")
        
        # Auto-confirm for autonomous execution
        print(f"\n⚠️  **Processing Plan:**")
        print(f"   • Process {len(unprocessed_recent_docs)} recent documents without insights")
        print(f"   • Generate 2-5 high-quality insights per document")  
        print(f"   • Skip older documents (more than 3 months old)")
        print(f"   • Cost estimate: ${len(unprocessed_recent_docs) * 0.02:.2f} - ${len(unprocessed_recent_docs) * 0.05:.2f} (OpenAI API)")
        
        # Autonomous execution - proceed automatically
        print("\n🤖 **AUTONOMOUS EXECUTION: Proceeding automatically...")
        
        # Process documents in batches
        print(f"\n🚀 **Processing {len(unprocessed_recent_docs)} recent documents...**")
        
        batch_size = 5  # Process 5 at a time to avoid rate limits
        processed_count = 0
        total_insights = 0
        errors = 0
        
        for i in range(0, len(unprocessed_recent_docs), batch_size):
            batch = unprocessed_recent_docs[i:i + batch_size]
            print(f"\n📦 **Batch {i//batch_size + 1}: Processing {len(batch)} documents...**")
            
            for doc in batch:
                doc_id = doc['id']
                doc_title = doc['title']
                date_str = doc['doc_date'].strftime('%Y-%m-%d') if doc['doc_date'] else 'Unknown'
                
                try:
                    # Get the actual content from documents table using file_id
                    content_result = supabase.table('documents')\
                        .select('content')\
                        .eq('file_id', doc_id)\
                        .execute()
                    
                    if not content_result.data:
                        print(f"   ⚠️  [{date_str}] {doc_title[:35]}...: No content found")
                        continue
                    
                    # Combine all content chunks for this document
                    full_content = "\n".join([chunk['content'] for chunk in content_result.data])
                    
                    if len(full_content.strip()) < 50:
                        print(f"   ⚠️  [{date_str}] {doc_title[:35]}...: Content too short ({len(full_content)} chars)")
                        continue
                    
                    # Process the document for insights
                    result = await engine.process_document(
                        document_id=doc_id,
                        content=full_content,
                        title=doc_title,
                        metadata={
                            'file_title': doc_title, 
                            'file_url': doc.get('url', ''),
                            'doc_date': date_str
                        }
                    )
                    
                    if result.get('success'):
                        insights_saved = result.get('insights_saved', 0)
                        total_insights += insights_saved
                        processed_count += 1
                        print(f"   ✅ [{date_str}] {doc_title[:35]}...: {insights_saved} insights")
                    else:
                        error = result.get('error', 'Unknown error')
                        errors += 1
                        print(f"   ❌ [{date_str}] {doc_title[:35]}...: {error}")
                
                except Exception as e:
                    errors += 1
                    print(f"   ❌ [{date_str}] {doc_title[:35]}...: {str(e)[:40]}...")
            
            # Brief pause between batches
            if i + batch_size < len(unprocessed_recent_docs):
                print("   ⏸️  Pausing 2 seconds...")
                await asyncio.sleep(2)
        
        # Final results
        print(f"\n🎉 **PROCESSING COMPLETE!**")
        print(f"✅ **Documents Processed:** {processed_count}/{len(unprocessed_recent_docs)}")
        print(f"💡 **Total Insights Created:** {total_insights}")
        print(f"❌ **Errors:** {errors}")
        if processed_count > 0:
            print(f"📊 **Average:** {total_insights/processed_count:.1f} insights per document")
        
        print(f"\n🎯 **What's Next:**")
        print("1. ✅ Recent documents now have enhanced insights")
        print("2. ✅ Future documents will automatically get insights (updated db_handler.py)")
        print("3. ✅ Your RAG system now prioritizes recent content with business intelligence")
        print("4. 📅 Older documents (3+ months) were skipped to focus on relevant content")
        
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("📦 Run: pip install supabase openai python-dotenv")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n🔧 **Troubleshooting:**")
        print("1. Check your .env file has all required API keys")
        print("2. Verify database connection and permissions")
        print("3. Make sure you have OpenAI API credits")

if __name__ == "__main__":
    asyncio.run(process_recent_insights())
