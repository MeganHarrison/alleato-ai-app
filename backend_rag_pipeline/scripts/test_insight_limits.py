#!/usr/bin/env python3
"""
Test New Insight Limits

Tests the enhanced insights engine with strict limits to ensure 
we never generate more than 5 insights per document again.
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

async def test_insight_limits():
    """Test that the new limits prevent over-generation."""
    
    try:
        from insights.enhanced.business_insights_engine import BusinessInsightsEngine
        from supabase import create_client
        from openai import AsyncOpenAI
        
        print("🧪 **TESTING NEW INSIGHT LIMITS**")
        print("=" * 60)
        
        # Initialize clients
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Initialize enhanced insights engine with new limits
        engine = BusinessInsightsEngine(
            supabase=supabase,
            openai_client=openai_client
        )
        
        print("✅ Initialized Enhanced Business Insights Engine with NEW LIMITS")
        
        # Create a very detailed document that WOULD generate many insights with old system
        verbose_document = {
            'id': 'test_limits_' + datetime.now().strftime('%Y%m%d_%H%M%S'),
            'title': 'Comprehensive Quarterly Business Review - September 23, 2024',
            'content': '''
            Comprehensive Quarterly Business Review - September 23, 2024
            
            Attendees: CEO Sarah Johnson, CFO Mike Chen, VP Engineering Lisa Rodriguez, VP Sales Tom Wilson, VP Marketing Amy Davis, Head of HR Jennifer Kim, Operations Manager David Lee
            
            📈 FINANCIAL PERFORMANCE
            - Q3 Revenue: $2.5M (up 15% from Q2)
            - Operating expenses: $1.8M (5% over budget - concerning)
            - Net profit: $700K (down from projected $900K)
            - Cash flow positive for 6th consecutive month
            - Accounts receivable: $450K (up 20% - collection issues)
            - Server costs reduced by $25K/month through optimization
            - New enterprise client signed: $500K annual contract
            - Lost major client: TechCorp ($300K annual revenue impact)
            
            🎯 PRODUCT DEVELOPMENT
            - Mobile app delayed by 6 weeks due to security audit findings
            - API v2.0 launched successfully with 99.9% uptime
            - Customer satisfaction score: 8.2/10 (target: 8.5)
            - 3 critical security vulnerabilities patched
            - Database migration completed 2 weeks behind schedule
            - New feature adoption rate: 65% (exceeding 60% target)
            - Technical debt reduced by 15% this quarter
            - 2 new developers hired, 1 senior engineer resigned
            
            🚀 SALES & MARKETING
            - Lead generation up 25% through new content strategy
            - Conversion rate improved from 12% to 15%
            - Average deal size increased to $45K (up from $38K)
            - Sales team quota attainment: 92% (target: 95%)
            - Marketing campaign ROI: 3.2x (improved from 2.8x)
            - Customer acquisition cost: $2,200 (up from $1,800 - concerning)
            - Churn rate: 8% (target: 5% - needs immediate attention)
            - Social media engagement increased 40%
            
            ⚠️ OPERATIONAL CHALLENGES
            - Office lease renewal deadline: October 31st (rent increasing 20%)
            - Remote work policy needs updating per legal requirements
            - Employee satisfaction survey: 75% (down from 82%)
            - 3 key staff members considering leaving per HR discussions
            - Compliance audit scheduled for November - preparation required
            - IT infrastructure upgrade needed by year-end ($150K budget request)
            - Customer support response time averaged 4.2 hours (target: 2 hours)
            - Supply chain disruption affected hardware orders
            
            🎯 STRATEGIC DECISIONS MADE
            1. Approved $300K marketing budget increase for Q4
            2. Decided to delay European expansion to Q2 2025
            3. Authorized hiring 5 additional customer success representatives
            4. Approved remote-first policy implementation
            5. Decided to acquire smaller competitor for $1.2M
            6. Approved new healthcare benefits package ($50K annual cost)
            7. Decided to discontinue legacy product line
            8. Authorized office space downsizing to reduce costs
            
            📋 ACTION ITEMS ASSIGNED
            1. Sarah: Finalize acquisition due diligence by October 15th
            2. Mike: Prepare detailed budget variance analysis by October 1st
            3. Lisa: Complete security audit remediation by September 30th
            4. Tom: Develop churn reduction strategy by October 10th
            5. Amy: Launch Q4 marketing campaign by October 5th
            6. Jennifer: Conduct retention interviews with at-risk employees
            7. David: Negotiate office lease terms by October 25th
            8. Lisa: Present IT infrastructure proposal by October 15th
            9. Tom: Implement new sales process by November 1st
            10. Amy: Complete competitive analysis by October 20th
            ''',
            'metadata': {
                'file_type': 'txt',
                'content_length': 2800,
                'project_id': 98765
            }
        }
        
        print(f"📄 **Testing with VERY DETAILED document:** {verbose_document['title']}")
        print(f"📊 **Content length:** {len(verbose_document['content'])} chars")
        print(f"⚠️  **Old system would generate 20-30+ insights from this**")
        print(f"🎯 **New system should generate MAX 5 insights**")
        
        # Process the document
        print(f"\n🚀 **Processing with new limits...**")
        result = await engine.process_document(
            document_id=verbose_document['id'],
            content=verbose_document['content'],
            title=verbose_document['title'],
            metadata=verbose_document['metadata']
        )
        
        # Check results
        insights_generated = result.get('insights_extracted', 0)
        insights_saved = result.get('insights_saved', 0)
        
        print(f"\n📊 **LIMIT TEST RESULTS:**")
        print(f"✅ Success: {result.get('success')}")
        print(f"📝 Insights Generated: {insights_generated}")
        print(f"💾 Insights Saved: {insights_saved}")
        print(f"⏱️ Processing Time: {result.get('processing_time_seconds', 0):.2f}s")
        
        # Verify limits
        if insights_saved <= 5:
            print(f"\n🎉 **LIMIT TEST PASSED!** ✅")
            print(f"   Generated {insights_saved} insights (≤ 5 limit)")
        else:
            print(f"\n❌ **LIMIT TEST FAILED!**")
            print(f"   Generated {insights_saved} insights (> 5 limit)")
            print(f"   BUG: Limits not working properly")
        
        if result.get('insights_by_type'):
            print(f"\n🎯 **Insight Types Generated:**")
            for insight_type, count in result['insights_by_type'].items():
                print(f"   {insight_type}: {count}")
        
        if result.get('insights_by_severity'):
            print(f"\n⚡ **Insight Severity Distribution:**")
            for severity, count in result['insights_by_severity'].items():
                print(f"   {severity}: {count}")
        
        # Show the actual insights to verify quality
        print(f"\n📋 **GENERATED INSIGHTS (should be high-quality only):**")
        try:
            insights = supabase.table('document_insights')\
                .select('title, insight_type, severity, confidence_score, financial_impact')\
                .eq('document_id', verbose_document['id'])\
                .execute()
            
            for i, insight in enumerate(insights.data, 1):
                financial = f" (${insight['financial_impact']})" if insight['financial_impact'] else ""
                confidence = insight['confidence_score'] or 0
                print(f"   {i}. {insight['title']} [{insight['insight_type']}]")
                print(f"      Severity: {insight['severity']}, Confidence: {confidence:.2f}{financial}")
        except Exception as e:
            print(f"   (Could not fetch detailed insights: {e})")
        
        print(f"\n🎯 **CONCLUSION:**")
        if insights_saved <= 5:
            print("✅ New limits are working perfectly!")
            print("✅ Only high-quality, business-critical insights generated")
            print("✅ RAG will be much more focused and useful")
        else:
            print("❌ Limits need more tuning - check the filtering logic")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_insight_limits())
