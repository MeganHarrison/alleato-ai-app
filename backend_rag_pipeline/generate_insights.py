#!/usr/bin/env python3
"""
Generate Business Insights - Production Script

Run this script to generate insights from documents in your database.
"""

import os
import sys
import asyncio
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv
from pathlib import Path

# Load environment first
project_root = Path(__file__).resolve().parent
dotenv_path = project_root / '.env'
load_dotenv(dotenv_path, override=True)

# Add project root to path
sys.path.append(str(project_root))

# Import directly from the modules we know exist
from supabase import create_client, Client
from insights.enhanced.business_insights_engine import BusinessInsightsEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Supabase client
def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    
    return create_client(supabase_url, supabase_key)


async def generate_insights_for_document(engine: BusinessInsightsEngine, document_id: str, content: str, title: str = "", metadata: Dict[str, Any] = None) -> Dict[str, Any]:
    """Generate insights for a single document."""
    print(f"\n🔍 Processing Document: {title or document_id}")
    print("=" * 60)
    
    try:
        # Process the document
        result = await engine.process_document(
            document_id=document_id,
            content=content,
            title=title,
            metadata=metadata or {}
        )
        
        # Display results
        if result['success']:
            print(f"✅ Success! Generated {result['insights_extracted']} insights")
            print(f"💾 Saved {result['insights_saved']} insights to database")
            print(f"⏱️  Processing time: {result['processing_time_seconds']:.2f} seconds")
            
            if result['insights_by_type']:
                print(f"\n📊 Insights by Type:")
                for insight_type, count in result['insights_by_type'].items():
                    print(f"   {insight_type}: {count}")
            
            if result['insights_by_severity']:
                print(f"\n🚨 Insights by Severity:")
                for severity, count in result['insights_by_severity'].items():
                    print(f"   {severity}: {count}")
                    
            return result
        else:
            print(f"❌ Failed: {result.get('error', 'Unknown error')}")
            return result
            
    except Exception as e:
        print(f"❌ Error processing document: {e}")
        return {'success': False, 'error': str(e)}


async def generate_insights_from_database(engine: BusinessInsightsEngine, limit: int = 5):
    """Generate insights from existing documents in the database."""
    print("\n📂 Fetching documents from database...")
    
    try:
        # Get documents from database
        supabase = get_supabase_client()
        response = supabase.table('documents').select('id, title, content, metadata').limit(limit).execute()
        
        if not response.data:
            print("❌ No documents found in database")
            return
        
        print(f"✅ Found {len(response.data)} documents")
        
        results = []
        for doc in response.data:
            result = await generate_insights_for_document(
                engine=engine,
                document_id=doc['id'],
                content=doc['content'] or '',
                title=doc['title'] or '',
                metadata=doc['metadata'] or {}
            )
            results.append(result)
            
        # Summary
        successful = sum(1 for r in results if r.get('success', False))
        total_insights = sum(r.get('insights_saved', 0) for r in results)
        
        print(f"\n🎯 SUMMARY:")
        print(f"Documents processed: {len(results)}")
        print(f"Successful: {successful}")
        print(f"Total insights generated: {total_insights}")
        
    except Exception as e:
        print(f"❌ Error fetching from database: {e}")


async def generate_insights_from_text(engine: BusinessInsightsEngine, content: str, title: str = "Custom Document"):
    """Generate insights from custom text input."""
    document_id = f"custom_{hash(content) % 10000}"
    
    result = await generate_insights_for_document(
        engine=engine,
        document_id=document_id,
        content=content,
        title=title
    )
    
    return result


async def main():
    """Main execution function."""
    print("🚀 Business Insights Generator")
    print("=" * 50)
    
    try:
        supabase = get_supabase_client()
        engine = BusinessInsightsEngine(supabase)
        
        print("✅ Initialized Business Insights Engine")
        print(f"🤖 Using model: {engine.model}")
        
        # Interactive menu
        while True:
            print("\n📋 CHOOSE AN OPTION:")
            print("1. Generate insights from database documents")
            print("2. Generate insights from custom text")
            print("3. Process sample meeting transcript")
            print("4. Exit")
            
            choice = input("\nEnter your choice (1-4): ").strip()
            
            if choice == "1":
                limit = int(input("How many documents to process? (default: 5): ") or 5)
                await generate_insights_from_database(engine, limit)
                
            elif choice == "2":
                print("Enter your text (press Ctrl+D when finished):")
                lines = []
                try:
                    while True:
                        line = input()
                        lines.append(line)
                except EOFError:
                    pass
                
                content = "\n".join(lines)
                title = input("Document title (optional): ").strip() or "Custom Document"
                
                if content.strip():
                    await generate_insights_from_text(engine, content, title)
                else:
                    print("❌ No content provided")
                    
            elif choice == "3":
                # Sample meeting transcript
                sample_content = """
Q4 Project Status Meeting - December 2024

Attendees: Sarah Johnson (PM), Mike Chen (Dev Lead), Lisa Rodriguez (Design), Tom Wilson (QA)

Sarah: Let's start with the current project status. Mike, how are we doing with the backend development?

Mike: We've completed about 85% of the backend work. However, we've identified a critical security vulnerability in the authentication system that needs immediate attention. This could delay our launch by 2-3 weeks.

Sarah: That's concerning. What's the financial impact of this delay?

Mike: Based on our contract, a delay beyond January 15th will result in a $50,000 penalty. Plus we'll need to allocate an additional developer for 3 weeks at $8,000 per week.

Tom: QA testing has revealed 23 bugs so far, with 3 classified as critical path blockers. We need at least 2 more weeks for proper testing once the security issue is resolved.

Lisa: From a design perspective, we're ready. But we should prepare client communication strategy for the potential delay.

Sarah: Action items: Mike to fix security vulnerability by COB today, Tom to prioritize critical bugs, Lisa to prepare client communication strategy. Let's schedule a CTO meeting for tomorrow morning.
                """.strip()
                
                await generate_insights_from_text(engine, sample_content, "Q4 Project Status Meeting")
                
            elif choice == "4":
                print("👋 Goodbye!")
                break
                
            else:
                print("❌ Invalid choice. Please enter 1-4.")
                
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
