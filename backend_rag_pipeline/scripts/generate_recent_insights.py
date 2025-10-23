#!/usr/bin/env python3
"""
Generate insights for the most recent documents in document_metadata table
Processes 5 documents at a time, starting with the most recent
"""

import os
import sys
import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client
from openai import AsyncOpenAI

# Load environment
load_dotenv('../.env')

# Initialize clients
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)
openai_client = AsyncOpenAI(api_key=os.getenv('LLM_API_KEY'))

async def generate_insights_for_document(doc: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate insights for a single document"""
    doc_id = doc['id']
    doc_title = doc.get('title', 'Unknown Document')
    content = doc.get('content', '')

    if not content:
        return []

    # Truncate content if too long (to manage token limits)
    max_content_length = 8000
    if len(content) > max_content_length:
        content = content[:max_content_length] + "... [truncated]"

    prompt = f"""
    Analyze this meeting transcript and extract 3-5 high-value business insights.

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
            "quotes": ["Relevant quote from the transcript"]
        }}
    ]
    """

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a business analyst extracting actionable insights from meeting transcripts. Return only valid JSON."},
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

async def main():
    print("🚀 RECENT DOCUMENTS INSIGHTS GENERATOR")
    print("=" * 60)

    # Get the 5 most recent documents with content
    print("\n📚 Fetching 5 most recent documents from document_metadata...")

    # First check how many we've already processed
    total_docs = supabase.table('document_metadata')\
        .select('id', count='exact')\
        .not_.is_('content', 'null')\
        .execute()

    processed_docs = supabase.table('document_insights')\
        .select('document_id', count='exact')\
        .execute()

    print(f"   Total documents: {total_docs.count}")
    print(f"   Documents with insights: {len(set(d['document_id'] for d in processed_docs.data)) if processed_docs.data else 0}")

    # Get documents that don't have insights yet
    # First get all document IDs that have insights
    insights_result = supabase.table('document_insights')\
        .select('document_id')\
        .execute()

    docs_with_insights = set(insight['document_id'] for insight in insights_result.data) if insights_result.data else set()

    # Get documents without insights
    docs_result = supabase.table('document_metadata')\
        .select('id, title, content, date, participants, summary, action_items, bullet_points')\
        .not_.is_('content', 'null')\
        .order('created_at', desc=True)\
        .limit(20)\
        .execute()

    if not docs_result.data:
        print("❌ No documents with content found")
        return

    documents = docs_result.data
    print(f"✅ Found {len(documents)} recent documents to check")

    # Check for existing insights and filter
    print("\n🔍 Checking for existing insights...")
    doc_ids = [doc['id'] for doc in documents]
    existing_insights = supabase.table('document_insights')\
        .select('document_id')\
        .in_('document_id', doc_ids)\
        .execute()

    processed_doc_ids = set(insight['document_id'] for insight in existing_insights.data) if existing_insights.data else set()

    documents_to_process = [doc for doc in documents if doc['id'] not in processed_doc_ids][:5]  # Limit to 5

    if not documents_to_process:
        print("✅ All recent documents already have insights")
        # Show what we have
        for doc in documents:
            count_result = supabase.table('document_insights')\
                .select('id', count='exact')\
                .eq('document_id', doc['id'])\
                .execute()
            print(f"   - {doc['title'][:50]}... ({count_result.count} insights)")
        return

    print(f"📝 Processing {len(documents_to_process)} documents without insights...")

    # Process each document
    total_insights = 0

    for i, doc in enumerate(documents_to_process, 1):
        doc_title = doc.get('title', 'Unknown')[:50]
        print(f"\n[{i}/{len(documents_to_process)}] Processing: {doc_title}...")
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
                        'severity': insight.get('priority', 'medium'),  # Map priority to severity
                        'doc_title': doc_title,
                        'document_date': doc.get('date'),
                        'metadata': {
                            'priority': insight.get('priority', 'medium'),
                            'generated_at': datetime.now().isoformat()
                        }
                    }

                    # Handle quotes if present - store in metadata
                    if 'quotes' in insight and insight['quotes']:
                        insight_data['metadata']['supporting_quotes'] = insight['quotes'][:3]

                    result = supabase.table('document_insights').insert(insight_data).execute()
                    total_insights += 1

                except Exception as e:
                    print(f"   ⚠️  Error saving insight: {e}")
        else:
            print(f"   ⚠️  No insights generated")

    # Summary
    print("\n" + "=" * 60)
    print(f"✨ COMPLETE: Generated {total_insights} insights from {len(documents_to_process)} documents")

    # Show all recent documents and their insight counts
    print("\n📊 Recent Documents Summary:")
    for doc in documents:
        count_result = supabase.table('document_insights')\
            .select('id', count='exact')\
            .eq('document_id', doc['id'])\
            .execute()
        status = "✅" if count_result.count > 0 else "⚠️"
        print(f"   {status} {doc['title'][:50]}... ({count_result.count} insights)")

if __name__ == "__main__":
    asyncio.run(main())