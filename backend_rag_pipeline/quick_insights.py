#!/usr/bin/env python3
"""Quick Insights Generation Script"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import get_supabase_client
from insights.enhanced.business_insights_engine import BusinessInsightsEngine
from core.utils import load_env

async def quick_insights():
    # Your content here
    content = """
    Team Meeting Notes - January 2025
    
    - Budget overrun by $25,000 due to unexpected technical challenges
    - Critical security patch needed before launch (assigned to John, due Friday)
    - Client expressing concerns about timeline delays
    - Need additional QA resources for next sprint
    - Marketing team requesting feature demo by end of week
    """
    
    load_env()
    supabase = get_supabase_client()
    engine = BusinessInsightsEngine(supabase)
    
    print("🚀 Generating insights...")
    result = await engine.process_document(
        document_id="quick_test_001",
        content=content,
        title="Team Meeting Notes - January 2025"
    )
    
    print(f"✅ Generated {result['insights_saved']} insights!")
    return result

if __name__ == "__main__":
    asyncio.run(quick_insights())
