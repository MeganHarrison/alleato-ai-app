#!/usr/bin/env python3
"""
Clean Up Over-Generated Insights

This script will:
1. Identify documents with too many insights (>5)
2. Re-rank them by quality/importance  
3. Keep only the top 3-5 insights per document
4. Delete the low-quality ones

Run this to fix your existing 979 insights down to manageable numbers.
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

async def cleanup_insights():
    """Clean up over-generated insights in the database."""
    
    try:
        from supabase import create_client
        
        print("🧹 **CLEANING UP OVER-GENERATED INSIGHTS**")
        print("=" * 60)
        
        # Initialize Supabase
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        print("✅ Connected to Supabase")
        
        # Get all insights grouped by document_id
        print("\n📊 **Analyzing current insights...**")
        
        all_insights = supabase.table('document_insights')\
            .select('*')\
            .execute()
        
        if not all_insights.data:
            print("❌ No insights found in database")
            return
        
        # Group by document_id
        insights_by_doc = {}
        for insight in all_insights.data:
            doc_id = insight['document_id']
            if doc_id not in insights_by_doc:
                insights_by_doc[doc_id] = []
            insights_by_doc[doc_id].append(insight)
        
        # Find documents with too many insights
        over_generated_docs = {}
        total_insights = len(all_insights.data)
        
        for doc_id, insights in insights_by_doc.items():
            if len(insights) > 5:  # More than 5 insights
                over_generated_docs[doc_id] = insights
        
        print(f"📈 **Current State:**")
        print(f"   Total insights: {total_insights}")
        print(f"   Total documents: {len(insights_by_doc)}")
        print(f"   Documents with >5 insights: {len(over_generated_docs)}")
        
        if not over_generated_docs:
            print("✅ No cleanup needed - all documents have ≤5 insights")
            return
        
        # Show worst offenders
        worst_docs = sorted(over_generated_docs.items(), key=lambda x: len(x[1]), reverse=True)[:10]
        print(f"\n🔥 **Worst Offenders:**")
        for doc_id, insights in worst_docs:
            doc_title = insights[0].get('doc_title', doc_id[:30])[:50]
            print(f"   {len(insights)} insights - {doc_title}...")
        
        # Ask for confirmation
        total_to_delete = sum(max(0, len(insights) - 5) for insights in over_generated_docs.values())
        print(f"\n⚠️  **Cleanup Plan:**")
        print(f"   • Keep top 5 insights per document (by quality score)")
        print(f"   • Delete {total_to_delete} lower-quality insights")
        print(f"   • Reduce from {total_insights} to {total_insights - total_to_delete} total insights")
        
        confirm = input("\nProceed with cleanup? [y/N]: ").lower().strip()
        
        if confirm != 'y':
            print("❌ Cleanup cancelled")
            return
        
        # Cleanup each over-generated document
        print(f"\n🧹 **Cleaning up {len(over_generated_docs)} documents...**")
        
        deleted_count = 0
        processed_docs = 0
        
        for doc_id, insights in over_generated_docs.items():
            # Rank insights by quality score
            ranked_insights = rank_insights_by_quality(insights)
            
            # Keep top 5, delete the rest
            keep_insights = ranked_insights[:5]
            delete_insights = ranked_insights[5:]
            
            if delete_insights:
                # Delete the low-quality insights
                delete_ids = [insight['id'] for insight in delete_insights]
                
                try:
                    delete_result = supabase.table('document_insights')\
                        .delete()\
                        .in_('id', delete_ids)\
                        .execute()
                    
                    deleted_count += len(delete_insights)
                    processed_docs += 1
                    
                    doc_title = insights[0].get('doc_title', doc_id[:30])[:40]
                    print(f"   ✅ {doc_title}: Kept {len(keep_insights)}, deleted {len(delete_insights)}")
                    
                except Exception as e:
                    print(f"   ❌ Error processing {doc_id}: {e}")
        
        # Final results
        print(f"\n🎉 **CLEANUP COMPLETE!**")
        print(f"✅ **Processed:** {processed_docs} documents")
        print(f"🗑️  **Deleted:** {deleted_count} low-quality insights")
        print(f"📊 **Result:** Much cleaner, focused insights!")
        
        print(f"\n🎯 **What's Next:**")
        print("1. Your insights are now limited to 5 per document maximum")
        print("2. Only high-quality, business-critical insights remain")
        print("3. RAG will be much more focused and useful")
        
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("📦 Run: pip install supabase python-dotenv")
        
    except Exception as e:
        print(f"❌ Error: {e}")

def rank_insights_by_quality(insights):
    """Rank insights by quality/importance score."""
    
    def quality_score(insight):
        score = 0.0
        
        # Base score from confidence
        score += insight.get('confidence_score', 0.5) * 10
        
        # Severity bonus
        severity = insight.get('severity', 'low')
        severity_bonus = {'critical': 8, 'high': 6, 'medium': 4, 'low': 2}
        score += severity_bonus.get(severity, 2)
        
        # Financial impact bonus
        if insight.get('financial_impact'):
            score += 5
        
        # Urgency indicators bonus
        if insight.get('urgency_indicators'):
            score += 3
        
        # Critical path bonus
        if insight.get('critical_path_impact'):
            score += 4
        
        # Assignee bonus (actionable)
        if insight.get('assignee'):
            score += 2
        
        # Due date bonus (time-sensitive)
        if insight.get('due_date'):
            score += 2
        
        # Penalize routine/generic titles
        title = insight.get('title', '').lower()
        if any(word in title for word in ['meeting', 'discussed', 'reviewed', 'mentioned']):
            score -= 3
        
        return score
    
    # Sort by quality score (highest first)
    return sorted(insights, key=quality_score, reverse=True)

if __name__ == "__main__":
    asyncio.run(cleanup_insights())
