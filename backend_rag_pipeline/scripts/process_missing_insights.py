#!/usr/bin/env python3
"""
Process Documents Without Insights

Finds documents in document_metadata table that don't have insights yet
and processes them with the new enhanced insights engine.
"""

import os
import sys
import asyncio
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

# Load environment variables
load_dotenv()

async def process_missing_insights():
    """Process documents from document_metadata that don't have insights yet."""
    
    try:
        from insights.enhanced.business_insights_engine import BusinessInsightsEngine
        from supabase import create_client
        from openai import AsyncOpenAI
        
        print("🔍 **FINDING DOCUMENTS WITHOUT INSIGHTS**")
        print("=" * 60)
        
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
        
        # Get all documents from document_metadata table
        print("\n📊 **Analyzing document_metadata...**")
        docs_result = supabase.table('document_metadata')\
            .select('id, title, url')\
            .execute()
        
        if not docs_result.data:
            print("❌ No documents found in document_metadata table")
            return
        
        # Get all document IDs that already have insights
        insights_result = supabase.table('document_insights')\
            .select('document_id')\
            .execute()
        
        processed_doc_ids = set()
        if insights_result.data:
            processed_doc_ids = {insight['document_id'] for insight in insights_result.data}
        
        # Find documents without insights
        unprocessed_docs = []
        for doc in docs_result.data:
            if doc['id'] not in processed_doc_ids:
                unprocessed_docs.append(doc)
        
        print(f"📈 **Current State:**")
        print(f"   Total documents in metadata: {len(docs_result.data)}")
        print(f"   Documents with insights: {len(processed_doc_ids)}")
        print(f"   Documents WITHOUT insights: {len(unprocessed_docs)}")
        
        if not unprocessed_docs:
            print("\n✅ All documents already have insights!")
            return
        
        # Show some examples of unprocessed documents
        print(f"\n📋 **Documents Missing Insights:**")
        for i, doc in enumerate(unprocessed_docs[:10]):
            title = doc['title'][:60] + "..." if len(doc['title']) > 60 else doc['title']
            print(f"   {i+1}. {title}")
        
        if len(unprocessed_docs) > 10:
            print(f"   ... and {len(unprocessed_docs) - 10} more")
        
        # Ask for confirmation
        print(f"\n⚠️  **Processing Plan:**")
        print(f"   • Process {len(unprocessed_docs)} documents without insights")
        print(f"   • Generate 2-5 high-quality insights per document")
        print(f"   • Cost estimate: ${len(unprocessed_docs) * 0.02:.2f} - ${len(unprocessed_docs) * 0.05:.2f} (OpenAI API)")
        
        confirm = input("\nProceed with processing? [y/N]: ").lower().strip()
        
        if confirm != 'y':
            print("❌ Processing cancelled")
            return
        
        # Process documents in batches
        print(f"\n🚀 **Processing {len(unprocessed_docs)} documents...**")
        
        batch_size = 5  # Process 5 at a time to avoid rate limits
        processed_count = 0
        total_insights = 0
        errors = 0
        
        for i in range(0, len(unprocessed_docs), batch_size):
            batch = unprocessed_docs[i:i + batch_size]
            print(f"\n📦 **Batch {i//batch_size + 1}: Processing {len(batch)} documents...**")
            
            for doc in batch:
                doc_id = doc['id']
                doc_title = doc['title']
                
                try:
                    # Get the actual content from documents table using file_id
                    content_result = supabase.table('documents')\
                        .select('content')\
                        .eq('file_id', doc_id)\
                        .execute()
                    
                    if not content_result.data:
                        print(f"   ⚠️  {doc_title[:40]}...: No content found in documents table")
                        continue
                    
                    # Combine all content chunks for this document
                    full_content = "\n".join([chunk['content'] for chunk in content_result.data])
                    
                    if len(full_content.strip()) < 50:
                        print(f"   ⚠️  {doc_title[:40]}...: Content too short ({len(full_content)} chars)")
                        continue
                    
                    # Process the document for insights
                    result = await engine.process_document(
                        document_id=doc_id,
                        content=full_content,
                        title=doc_title,
                        metadata={'file_title': doc_title, 'file_url': doc.get('url', '')}
                    )
                    
                    if result.get('success'):
                        insights_saved = result.get('insights_saved', 0)
                        total_insights += insights_saved
                        processed_count += 1
                        print(f"   ✅ {doc_title[:40]}...: {insights_saved} insights")
                    else:
                        error = result.get('error', 'Unknown error')
                        errors += 1
                        print(f"   ❌ {doc_title[:40]}...: {error}")
                
                except Exception as e:
                    errors += 1
                    print(f"   ❌ {doc_title[:40]}...: {str(e)[:50]}...")
            
            # Brief pause between batches
            if i + batch_size < len(unprocessed_docs):
                print("   ⏸️  Pausing 2 seconds...")
                await asyncio.sleep(2)
        
        # Final results
        print(f"\n🎉 **PROCESSING COMPLETE!**")
        print(f"✅ **Documents Processed:** {processed_count}/{len(unprocessed_docs)}")
        print(f"💡 **Total Insights Created:** {total_insights}")
        print(f"❌ **Errors:** {errors}")
        if processed_count > 0:
            print(f"📊 **Average:** {total_insights/processed_count:.1f} insights per document")
        
        print(f"\n🎯 **What's Next:**")
        print("1. Check your Supabase 'document_insights' table to see new insights")
        print("2. Your RAG now has enhanced business intelligence for all documents!")
        print("3. New documents will automatically get insights when uploaded")
        
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
    asyncio.run(process_missing_insights())
