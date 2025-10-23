#!/usr/bin/env python3
"""Process All Uploaded Documents for Insights"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import get_supabase_client
from insights.enhanced.business_insights_engine import BusinessInsightsEngine
from core.utils import load_env

async def process_all_documents():
    load_env()
    supabase = get_supabase_client()
    engine = BusinessInsightsEngine(supabase)
    
    # Get all documents without insights
    print("🔍 Finding documents without insights...")
    
    # Query documents
    documents = supabase.table('documents').select('id, title, content, metadata').execute()
    
    if not documents.data:
        print("❌ No documents found")
        return
    
    print(f"📄 Found {len(documents.data)} documents")
    
    total_insights = 0
    for i, doc in enumerate(documents.data, 1):
        print(f"\n📝 Processing {i}/{len(documents.data)}: {doc.get('title', doc['id'])}")
        
        result = await engine.process_document(
            document_id=doc['id'],
            content=doc.get('content', ''),
            title=doc.get('title', ''),
            metadata=doc.get('metadata', {})
        )
        
        if result['success']:
            insights_saved = result['insights_saved']
            total_insights += insights_saved
            print(f"   ✅ Generated {insights_saved} insights")
        else:
            print(f"   ❌ Failed: {result.get('error', 'Unknown error')}")
    
    print(f"\n🎯 COMPLETE! Total insights generated: {total_insights}")

if __name__ == "__main__":
    asyncio.run(process_all_documents())
