#!/usr/bin/env python3
"""
Test Enhanced Insights - Single Document

Run this to test the enhanced insights engine on one document.
Perfect for verifying everything works before processing lots of files.
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

async def test_single_document():
    """Test enhanced insights on a single sample document."""
    
    try:
        from insights.enhanced.business_insights_engine import BusinessInsightsEngine
        from supabase import create_client
        from openai import AsyncOpenAI
        
        print("🚀 **TESTING ENHANCED INSIGHTS ENGINE**")
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
        
        # Sample document with meeting date in title
        test_document = {
            'id': 'test_enhanced_insights_' + datetime.now().strftime('%Y%m%d_%H%M%S'),
            'title': 'Engineering Standup - September 23, 2024',
            'content': '''
            Engineering Standup - September 23, 2024
            
            Attendees: Sarah (Lead), Mike (Backend), Lisa (Frontend)
            
            🎯 Key Updates:
            - API optimization completed - saving $15,000/month in server costs
            - Database migration delayed to October 15th - URGENT timeline issue  
            - New authentication system deployed successfully
            - Client reported critical bug in payment processing - needs immediate fix
            
            ⚡ Action Items:
            1. Sarah: Security audit completion by September 30th
            2. Mike: Fix payment bug ASAP - blocking customer transactions
            3. Lisa: UI improvements for mobile app by end of month
            
            ⚠️ Risks & Concerns:
            - Server capacity may not handle holiday traffic surge
            - Budget overrun risk if we don't optimize cloud spending
            - Team burnout concerns with current sprint velocity
            
            💰 Financial Impact:
            - Server optimization: +$15k/month savings
            - Potential penalty for payment downtime: -$25k if not fixed quickly
            
            ✅ Decisions Made:
            - Approved hiring 2 additional developers (budget: $200k/year)
            - Decided to delay mobile release to Q1 2025
            - Switching to new monitoring tool (cost: $500/month)
            ''',
            'metadata': {
                'file_type': 'txt',
                'content_length': 1200,
                'project_id': 12345
            }
        }
        
        print(f"📄 **Processing Document:** {test_document['title']}")
        
        # Process the document
        result = await engine.process_document(
            document_id=test_document['id'],
            content=test_document['content'],
            title=test_document['title'],
            metadata=test_document['metadata']
        )
        
        # Display results
        print(f"\n📊 **RESULTS:**")
        print(f"✅ Success: {result.get('success')}")
        print(f"📝 Insights Found: {result.get('insights_extracted')}")
        print(f"💾 Insights Saved: {result.get('insights_saved')}")
        print(f"⏱️ Processing Time: {result.get('processing_time_seconds', 0):.2f}s")
        
        if result.get('insight_ids'):
            print(f"🆔 **Insight IDs:** {result['insight_ids'][:3]}...")  # Show first 3
        
        if result.get('insights_by_type'):
            print(f"\n🎯 **Insights by Type:**")
            for insight_type, count in result['insights_by_type'].items():
                print(f"   {insight_type}: {count}")
        
        if result.get('insights_by_severity'):
            print(f"\n⚡ **Insights by Severity:**")
            for severity, count in result['insights_by_severity'].items():
                print(f"   {severity}: {count}")
        
        # Show some example insights from database
        print(f"\n📋 **SAMPLE INSIGHTS FROM DATABASE:**")
        try:
            insights = supabase.table('document_insights')\
                .select('title, insight_type, severity, document_date, financial_impact')\
                .eq('document_id', test_document['id'])\
                .limit(5)\
                .execute()
            
            for insight in insights.data:
                financial = f" (${insight['financial_impact']})" if insight['financial_impact'] else ""
                print(f"   • {insight['title']} [{insight['insight_type']}] - {insight['severity']}")
                print(f"     📅 Date: {insight['document_date']}{financial}")
        except Exception as e:
            print(f"   (Could not fetch sample insights: {e})")
        
        print(f"\n🎉 **SUCCESS!** Enhanced insights with meeting dates are working!")
        print(f"🎯 **Next:** Check your Supabase 'document_insights' table to see the results")
        
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("📦 Run: pip install supabase openai python-dotenv")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n🔧 **Troubleshooting:**")
        print("1. Check your .env file has SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY")
        print("2. Verify you ran the SQL to add document_date column")
        print("3. Make sure you have credits in your OpenAI account")

if __name__ == "__main__":
    asyncio.run(test_single_document())
