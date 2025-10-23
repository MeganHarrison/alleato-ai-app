#!/usr/bin/env python3
"""
Generate insights for all document_metadata entries for a specific meeting.
Searches by meeting title/name in the title field.
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
    Analyze this meeting document and extract 3-5 high-value business insights.

    Meeting: {doc_title}
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
    - Identify key business relationships and partnerships

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
            "quotes": ["Relevant quote from the meeting"]
        }}
    ]
    """

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a business analyst extracting actionable insights from meeting documents. Return only valid JSON."},
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

async def process_meeting_documents(meeting_name: str, force: bool = False):
    """
    Process all documents for a specific meeting.

    Args:
        meeting_name: Name/title of the meeting to search for (case-insensitive)
        force: If True, regenerate insights even if they already exist
    """
    print(f"🚀 MEETING INSIGHTS GENERATOR")
    print(f"🎯 Meeting: '{meeting_name}'")
    print("=" * 60)

    # Search for documents matching the meeting name (case-insensitive)
    print(f"\n📚 Searching for documents with '{meeting_name}' in title...")

    # Use ilike for case-insensitive search
    search_pattern = f"%{meeting_name}%"
    docs_result = supabase.table('document_metadata')\
        .select('id, title, content, date, participants, summary, action_items, bullet_points')\
        .ilike('title', search_pattern)\
        .not_.is_('content', 'null')\
        .order('date', desc=True)\
        .execute()

    if not docs_result.data:
        print(f"❌ No documents found matching '{meeting_name}'")

        # Show some available meetings as suggestions
        print("\n📋 Available meetings (showing first 10):")
        sample_docs = supabase.table('document_metadata')\
            .select('title')\
            .not_.is_('content', 'null')\
            .limit(10)\
            .execute()

        if sample_docs.data:
            seen_titles = set()
            for doc in sample_docs.data:
                title = doc['title'][:60]
                if title not in seen_titles:
                    print(f"   • {title}")
                    seen_titles.add(title)
        return

    all_documents = docs_result.data
    print(f"✅ Found {len(all_documents)} document(s) for '{meeting_name}'")

    # Show document details
    print("\n📄 Documents found:")
    for i, doc in enumerate(all_documents, 1):
        doc_date = doc.get('date', 'No date')[:10] if doc.get('date') else 'No date'
        participants = doc.get('participants', [])
        participants_str = f"{len(participants)} participants" if participants else "No participants"
        print(f"   {i}. {doc['title'][:80]}")
        print(f"      Date: {doc_date} | {participants_str}")

    if not force:
        # Check for existing insights
        print("\n🔍 Checking for existing insights...")
        doc_ids = [doc['id'] for doc in all_documents]
        existing_insights = supabase.table('document_insights')\
            .select('document_id')\
            .in_('document_id', doc_ids)\
            .execute()

        processed_doc_ids = set(insight['document_id'] for insight in existing_insights.data) if existing_insights.data else set()
        documents_to_process = [doc for doc in all_documents if doc['id'] not in processed_doc_ids]

        if not documents_to_process:
            print(f"\n✨ All documents for '{meeting_name}' already have insights!")

            # Show insight counts
            print("\n📊 Existing insights summary:")
            for doc in all_documents:
                count_result = supabase.table('document_insights')\
                    .select('id', count='exact')\
                    .eq('document_id', doc['id'])\
                    .execute()
                print(f"   • {doc['title'][:60]}: {count_result.count} insights")

            print("\n💡 Use --force to regenerate insights anyway")
            return
    else:
        print("\n⚠️  Force mode: Regenerating all insights")
        documents_to_process = all_documents

        # Delete existing insights if force mode
        for doc in documents_to_process:
            delete_result = supabase.table('document_insights')\
                .delete()\
                .eq('document_id', doc['id'])\
                .execute()
            if delete_result.data:
                print(f"   🗑️  Deleted {len(delete_result.data)} existing insights for {doc['title'][:40]}...")

    print(f"\n📝 Processing {len(documents_to_process)} document(s)...")
    print("-" * 40)

    # Process each document
    total_insights = 0
    successful_docs = 0
    failed_docs = 0

    for i, doc in enumerate(documents_to_process, 1):
        doc_title = doc.get('title', 'Unknown')
        doc_date = doc.get('date', 'Unknown')

        print(f"\n[{i}/{len(documents_to_process)}] Processing: {doc_title[:80]}")
        print(f"   📅 Date: {doc_date}")
        print(f"   👥 Participants: {', '.join(doc.get('participants', []))[:100] if doc.get('participants') else 'None listed'}")
        print(f"   📏 Content length: {len(doc.get('content', ''))} characters")

        # Generate insights
        insights = await generate_insights_for_document(doc)

        if insights:
            print(f"   💡 Generated {len(insights)} insights")
            doc_insights_saved = 0

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
                            'meeting_search': meeting_name,
                            'force_regenerated': force
                        }
                    }

                    # Handle quotes if present
                    if 'quotes' in insight and insight['quotes']:
                        insight_data['metadata']['supporting_quotes'] = insight['quotes'][:3]

                    result = supabase.table('document_insights').insert(insight_data).execute()
                    total_insights += 1
                    doc_insights_saved += 1

                except Exception as e:
                    print(f"   ⚠️  Error saving insight: {e}")

            if doc_insights_saved > 0:
                successful_docs += 1
                print(f"   ✅ Saved {doc_insights_saved} insights successfully")
            else:
                failed_docs += 1
                print(f"   ❌ Failed to save any insights")
        else:
            failed_docs += 1
            print(f"   ⚠️  No insights generated")

        # Small delay to avoid rate limiting
        await asyncio.sleep(0.5)

    # Final summary
    print("\n" + "=" * 60)
    print(f"✨ COMPLETE!")
    print(f"   📄 Documents processed: {len(documents_to_process)}")
    print(f"   ✅ Successful: {successful_docs}")
    print(f"   ❌ Failed: {failed_docs}")
    print(f"   💡 Total insights generated: {total_insights}")
    if len(documents_to_process) > 0:
        print(f"   📊 Average insights per document: {total_insights / len(documents_to_process):.1f}")

    # Show final status of all documents for this meeting
    print(f"\n📈 Final Status for '{meeting_name}' documents:")
    for doc in all_documents:
        count_result = supabase.table('document_insights')\
            .select('id', count='exact')\
            .eq('document_id', doc['id'])\
            .execute()

        status = "✅" if count_result.count > 0 else "⚠️"
        doc_date = doc.get('date', 'No date')[:10] if doc.get('date') else 'No date'
        print(f"   {status} [{doc_date}] {doc['title'][:60]}: {count_result.count} insights")

    # Show sample insights
    if total_insights > 0:
        print(f"\n💡 Sample insights generated:")
        sample_insights = supabase.table('document_insights')\
            .select('title, insight_type, severity')\
            .in_('document_id', [d['id'] for d in documents_to_process])\
            .limit(3)\
            .execute()

        for insight in sample_insights.data:
            type_emoji = {
                'action_item': '📋',
                'decision': '🎯',
                'risk': '⚠️',
                'opportunity': '💡',
                'key_finding': '🔍',
                'blocker': '🚫',
                'milestone': '🏁'
            }.get(insight['insight_type'], '📝')

            print(f"   {type_emoji} [{insight['severity'].upper()}] {insight['title'][:80]}")

async def list_available_meetings():
    """List available meetings in the database"""
    print("📋 AVAILABLE MEETINGS")
    print("=" * 60)

    # Get unique meeting titles
    docs_result = supabase.table('document_metadata')\
        .select('title, date, participants')\
        .not_.is_('content', 'null')\
        .order('date', desc=True)\
        .execute()

    if not docs_result.data:
        print("❌ No documents found")
        return

    # Group by meeting name (extract common patterns)
    meetings = {}
    for doc in docs_result.data:
        title = doc['title']
        # Try to extract meeting name (before date or common separators)
        meeting_key = title.split(' - ')[0] if ' - ' in title else title.split(' (')[0] if ' (' in title else title[:50]

        if meeting_key not in meetings:
            meetings[meeting_key] = {
                'count': 0,
                'latest_date': doc.get('date'),
                'participants': set()
            }

        meetings[meeting_key]['count'] += 1
        if doc.get('date') and (not meetings[meeting_key]['latest_date'] or doc['date'] > meetings[meeting_key]['latest_date']):
            meetings[meeting_key]['latest_date'] = doc['date']

        if doc.get('participants'):
            meetings[meeting_key]['participants'].update(doc['participants'])

    # Sort by count and display
    sorted_meetings = sorted(meetings.items(), key=lambda x: x[1]['count'], reverse=True)

    print(f"\nFound {len(sorted_meetings)} unique meeting series:\n")
    for meeting_name, info in sorted_meetings[:20]:  # Show top 20
        date_str = info['latest_date'][:10] if info['latest_date'] else 'No date'
        participants_str = f"{len(info['participants'])} unique participants" if info['participants'] else ""
        print(f"   • {meeting_name[:60]}")
        print(f"     Documents: {info['count']} | Latest: {date_str} | {participants_str}")

    print(f"\n💡 Use: python {Path(__file__).name} --meeting \"<meeting name>\" to generate insights")

async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Generate insights for specific meetings')
    parser.add_argument('--meeting', type=str, help='Meeting name to search for (case-insensitive)')
    parser.add_argument('--force', action='store_true', help='Force regeneration of insights even if they exist')
    parser.add_argument('--list', action='store_true', help='List available meetings')

    args = parser.parse_args()

    if args.list:
        await list_available_meetings()
    elif args.meeting:
        await process_meeting_documents(args.meeting, force=args.force)
    else:
        # Default: show usage and list meetings
        print("Usage: python generate_insights_by_meeting.py --meeting \"Meeting Name\"")
        print("\nOptions:")
        print("  --meeting NAME   Generate insights for all documents matching this meeting name")
        print("  --force          Force regeneration even if insights already exist")
        print("  --list           List all available meetings")
        print("\nExample:")
        print("  python generate_insights_by_meeting.py --meeting \"Westfield Collective\"")
        print("  python generate_insights_by_meeting.py --meeting \"westfield\" --force")
        print()
        await list_available_meetings()

if __name__ == "__main__":
    asyncio.run(main())