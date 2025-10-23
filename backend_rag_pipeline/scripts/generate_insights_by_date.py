#!/usr/bin/env python3
"""
Generate insights for document_metadata entries that don't have insights yet.
Prioritizes documents by the 'date' column (most recent first), not 'created_at'.
"""

import os
import sys
import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from supabase import create_client
from openai import AsyncOpenAI

# Load environment from parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Initialize clients
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)
openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY', os.getenv('LLM_API_KEY')))

async def generate_insights_for_document(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate insights for a single document"""
    doc_id = doc['id']
    doc_title = doc.get('title', 'Unknown Document')
    content = doc.get('content', '')

    if not content:
        print(f"   ⚠️  No content for document: {doc_title}")
        return []

    # Truncate content if too long (to manage token limits)
    max_content_length = 8000
    if len(content) > max_content_length:
        content = content[:max_content_length] + "... [truncated]"

    prompt = f"""
    Analyze this document and extract 3-5 high-value business insights.

    Document: {doc_title}
    Date: {doc.get('date', 'Unknown')}
    Participants: {doc.get('participants', 'Unknown')}

    Content:
    {content}

    For each insight, provide:
    1. A clear, actionable title
    2. A detailed description
    3. The type (action_item, decision, risk, opportunity, key_finding, blocker, milestone)
    4. Business impact assessment
    5. Priority level (high, medium, low)
    6. Affected stakeholders
    7. Any dependencies

    Return as a JSON array of insight objects. Be specific and focus on insights that:
    - Require immediate action or decisions
    - Represent risks or opportunities
    - Track important project milestones
    - Highlight blockers or dependencies

    Example format:
    [
        {{
            "title": "Specific action or finding",
            "description": "Detailed explanation with context",
            "type": "action_item",
            "business_impact": "How this affects the business",
            "priority": "high",
            "stakeholders": ["Person/Team affected"],
            "dependencies": ["What this depends on"],
            "quotes": ["Relevant quote from the document"]
        }}
    ]
    """

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a business analyst extracting actionable insights from documents. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.7
        )

        insights_text = response.choices[0].message.content
        # Clean up the response to ensure valid JSON
        insights_text = insights_text.strip()
        if insights_text.startswith("```json"):
            insights_text = insights_text[7:]
        if insights_text.endswith("```"):
            insights_text = insights_text[:-3]

        insights = json.loads(insights_text)

        # Add document reference to each insight
        for insight in insights:
            insight['document_id'] = doc_id
            insight['document_title'] = doc_title
            insight['document_date'] = doc.get('date')

        return insights

    except Exception as e:
        print(f"   ❌ Error generating insights: {e}")
        return []

async def process_documents(batch_size: int = 5, limit: Optional[int] = None):
    """
    Process documents that don't have insights yet, ordered by date column.

    Args:
        batch_size: Number of documents to process at once
        limit: Optional maximum total number of documents to process
    """
    print("🚀 DOCUMENT INSIGHTS GENERATOR (BY DATE)")
    print("=" * 60)

    # Get documents that already have insights
    print("\n📊 Checking existing insights...")
    insights_result = supabase.table('document_insights')\
        .select('document_id')\
        .execute()

    docs_with_insights = set(insight['document_id'] for insight in insights_result.data) if insights_result.data else set()
    print(f"   Documents with insights: {len(docs_with_insights)}")

    # Get all documents with content, ordered by date (most recent first)
    print("\n📚 Fetching documents ordered by date...")
    docs_result = supabase.table('document_metadata')\
        .select('id, title, content, date, participants, summary, action_items, bullet_points')\
        .not_.is_('content', 'null')\
        .not_.is_('date', 'null')\
        .order('date', desc=True)\
        .execute()

    if not docs_result.data:
        print("❌ No documents with content and date found")
        return

    # Filter out documents that already have insights
    all_documents = docs_result.data
    documents_to_process = [doc for doc in all_documents if doc['id'] not in docs_with_insights]

    print(f"✅ Found {len(all_documents)} total documents")
    print(f"📝 {len(documents_to_process)} documents need insights")

    if not documents_to_process:
        print("\n✨ All documents already have insights!")
        return

    # Apply limit if specified
    if limit:
        documents_to_process = documents_to_process[:limit]
        print(f"🔧 Limited to processing {len(documents_to_process)} documents")

    # Process documents in batches
    total_insights = 0
    total_processed = 0

    for batch_start in range(0, len(documents_to_process), batch_size):
        batch_end = min(batch_start + batch_size, len(documents_to_process))
        batch = documents_to_process[batch_start:batch_end]

        print(f"\n📦 Processing batch {batch_start // batch_size + 1} ({len(batch)} documents)")
        print("-" * 40)

        for i, doc in enumerate(batch, 1):
            total_processed += 1
            doc_title = doc.get('title', 'Unknown')[:60]
            doc_date = doc.get('date', 'Unknown')

            print(f"\n[{total_processed}/{len(documents_to_process)}] Processing: {doc_title}")
            print(f"   📅 Date: {doc_date}")
            print(f"   📏 Content length: {len(doc.get('content', ''))} characters")

            # Generate insights
            insights = await generate_insights_for_document(doc)

            if insights:
                print(f"   💡 Generated {len(insights)} insights")

                # Save to database
                for insight in insights:
                    try:
                        insight_data = {
                            'document_id': doc['id'],
                            'title': insight.get('title', 'Untitled Insight'),
                            'description': insight.get('description', ''),
                            'insight_type': insight.get('type', 'key_finding'),
                            'business_impact': insight.get('business_impact', ''),
                            'stakeholders_affected': insight.get('stakeholders', []),
                            'dependencies': insight.get('dependencies', []),
                            'confidence_score': 0.85,
                            'generated_by': 'gpt-4o-mini',
                            'severity': insight.get('priority', 'medium'),
                            'doc_title': doc.get('title', 'Unknown'),
                            'document_date': doc.get('date'),
                            'metadata': {
                                'priority': insight.get('priority', 'medium'),
                                'generated_at': datetime.now().isoformat(),
                                'generated_from_date_column': True
                            }
                        }

                        # Handle quotes if present
                        if 'quotes' in insight and insight['quotes']:
                            insight_data['metadata']['supporting_quotes'] = insight['quotes'][:3]

                        result = supabase.table('document_insights').insert(insight_data).execute()
                        total_insights += 1

                    except Exception as e:
                        print(f"   ⚠️  Error saving insight: {e}")
            else:
                print(f"   ⚠️  No insights generated")

            # Small delay to avoid rate limiting
            await asyncio.sleep(0.5)

    # Final summary
    print("\n" + "=" * 60)
    print(f"✨ COMPLETE!")
    print(f"   📄 Documents processed: {total_processed}")
    print(f"   💡 Total insights generated: {total_insights}")
    print(f"   📊 Average insights per document: {total_insights / total_processed:.1f}" if total_processed > 0 else "")

    # Show summary of all documents
    print("\n📈 Document Status Summary:")

    # Re-fetch to show updated status
    insights_result = supabase.table('document_insights')\
        .select('document_id')\
        .execute()

    docs_with_insights = set(insight['document_id'] for insight in insights_result.data) if insights_result.data else set()

    # Show first 10 documents and their status
    for doc in all_documents[:10]:
        count_result = supabase.table('document_insights')\
            .select('id', count='exact')\
            .eq('document_id', doc['id'])\
            .execute()

        status = "✅" if doc['id'] in docs_with_insights else "⚠️"
        doc_date = doc.get('date', 'No date')[:10] if doc.get('date') else 'No date'
        print(f"   {status} [{doc_date}] {doc['title'][:50]}... ({count_result.count} insights)")

    remaining = len([d for d in all_documents if d['id'] not in docs_with_insights])
    if remaining > 0:
        print(f"\n   📝 {remaining} documents still need insights")
        print(f"   💡 Run the script again to process more documents")

async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Generate insights for documents ordered by date')
    parser.add_argument('--batch-size', type=int, default=5, help='Number of documents to process at once')
    parser.add_argument('--limit', type=int, help='Maximum number of documents to process')
    parser.add_argument('--all', action='store_true', help='Process all documents without insights')

    args = parser.parse_args()

    # If --all is specified, remove the limit
    limit = None if args.all else args.limit

    await process_documents(batch_size=args.batch_size, limit=limit)

if __name__ == "__main__":
    asyncio.run(main())