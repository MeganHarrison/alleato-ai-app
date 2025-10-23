#!/usr/bin/env python3
"""
Quick Test - Balanced Limits

Test the newly balanced filtering that should generate 2-5 insights 
instead of 0 (too restrictive) or 30+ (too permissive).
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

async def test_balanced_limits():
    """Test the balanced filtering approach."""
    
    try:
        from insights.enhanced.business_insights_engine import BusinessInsightsEngine
        from supabase import create_client
        from openai import AsyncOpenAI
        
        print("🧪 **TESTING BALANCED INSIGHT LIMITS**")
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
        
        print("✅ Initialized Enhanced Business Insights Engine with BALANCED LIMITS")
        
        # Simpler test document to start with
        test_document = {
            'id': 'test_balanced_' + datetime.now().strftime('%Y%m%d_%H%M%S'),
            'title': 'Weekly Team Meeting - September 23, 2024',
            'content': '''
            Weekly Team Meeting - September 23, 2024
            
            Key Updates:
            - Budget approved for Q4 marketing campaign: $50,000
            - Server costs reduced by $5,000/month through optimization 
            - Critical security vulnerability discovered in payment system
            - Sarah will complete security audit by September 30th
            - New client signed: TechCorp contract worth $75,000 annually
            - Database migration delayed by 2 weeks due to compliance issues
            
            Action Items:
            1. Mike: Fix payment security issue ASAP (blocking customer transactions)
            2. Lisa: Prepare budget variance report by October 1st
            3. John: Interview 3 developer candidates this week
            
            Concerns:
            - Team burnout risk due to overtime hours
            - Office lease expires December 31st - need renewal decision
            ''',
            'metadata': {
                'file_type': 'txt',
                'content_length': 800,
                'project_id': 12345
            }
        }
        
        print(f"📄 **Testing with BALANCED document:** {test_document['title']}")
        print(f"📊 **Content length:** {len(test_document['content'])} chars")
        print(f"🎯 **Expected:** 3-5 quality insights")
        
        # Process the document
        print(f"\n🚀 **Processing with balanced limits...**")
        result = await engine.process_document(
            document_id=test_document['id'],
            content=test_document['content'],
            title=test_document['title'],
            metadata=test_document['metadata']
        )
        
        # Check results
        insights_generated = result.get('insights_extracted', 0)
        insights_saved = result.get('insights_saved', 0)
        
        print(f"\n📊 **BALANCED TEST RESULTS:**")
        print(f"✅ Success: {result.get('success')}")
        print(f"📝 Insights Generated: {insights_generated}")
        print(f"💾 Insights Saved: {insights_saved}")
        print(f"⏱️ Processing Time: {result.get('processing_time_seconds', 0):.2f}s")
        
        # Evaluate the balance
        if insights_saved == 0:
            print(f"\n❌ **STILL TOO RESTRICTIVE!**")
            print(f"   Generated {insights_saved} insights (should be 2-5)")
            print(f"   Need to lower thresholds further")
        elif insights_saved > 8:
            print(f"\n❌ **TOO PERMISSIVE!**") 
            print(f"   Generated {insights_saved} insights (should be 2-5)")
            print(f"   Need to raise thresholds")
        else:
            print(f"\n🎉 **BALANCED TEST PASSED!** ✅")
            print(f"   Generated {insights_saved} insights (good balance)")
        
        if result.get('insights_by_type'):
            print(f"\n🎯 **Insight Types Generated:**")
            for insight_type, count in result['insights_by_type'].items():
                print(f"   {insight_type}: {count}")
        
        if result.get('insights_by_severity'):
            print(f"\n⚡ **Insight Severity Distribution:**")
            for severity, count in result['insights_by_severity'].items():
                print(f"   {severity}: {count}")
        
        # Show the actual insights
        print(f"\n📋 **GENERATED INSIGHTS:**")
        try:
            insights = supabase.table('document_insights')\
                .select('title, insight_type, severity, confidence_score, financial_impact, description')\
                .eq('document_id', test_document['id'])\
                .execute()
            
            for i, insight in enumerate(insights.data, 1):
                financial = f" (${insight['financial_impact']})" if insight['financial_impact'] else ""
                confidence = insight['confidence_score'] or 0
                print(f"   {i}. {insight['title']} [{insight['insight_type']}]")
                print(f"      Severity: {insight['severity']}, Confidence: {confidence:.2f}{financial}")
                print(f"      Description: {insight['description'][:100]}...")
                print()
        except Exception as e:
            print(f"   (Could not fetch insights: {e})")
        
        print(f"🎯 **NEXT STEPS:**")
        if insights_saved >= 2 and insights_saved <= 5:
            print("✅ Perfect! Run cleanup script to fix existing insights")
            print("🚀 Command: python scripts/cleanup_insights.py")
        elif insights_saved == 0:
            print("⚠️  Still too restrictive - need to lower thresholds more")
        else:
            print("⚠️  Need fine-tuning - adjust confidence/filtering")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_balanced_limits())
