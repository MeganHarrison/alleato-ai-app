#!/usr/bin/env python3
"""
Automated Insights Generator
Designed to run as a scheduled job (cron, GitHub Actions, etc.)
Processes all documents without insights, with configurable batch size.
"""

import os
import sys
import json
import asyncio
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client
from openai import AsyncOpenAI

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('insights_generation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment
load_dotenv('../.env')

# Configuration
BATCH_SIZE = int(os.getenv('INSIGHTS_BATCH_SIZE', '10'))  # Process 10 docs at a time
MAX_DOCUMENTS_PER_RUN = int(os.getenv('MAX_DOCS_PER_RUN', '50'))  # Max 50 docs per run
MIN_CONTENT_LENGTH = 100  # Skip documents with less than 100 chars

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

    if len(content) < MIN_CONTENT_LENGTH:
        logger.warning(f"Skipping document {doc_title} - content too short ({len(content)} chars)")
        return []

    # Truncate content if too long
    max_content_length = 8000
    if len(content) > max_content_length:
        content = content[:max_content_length] + "... [truncated]"

    prompt = f"""
    Analyze this meeting transcript and extract 3-5 high-value business insights.

    Document: {doc_title}
    Date: {doc.get('date', 'Unknown')}

    Content:
    {content}

    Focus on:
    - Action items that need immediate attention
    - Important decisions that were made
    - Risks that need mitigation
    - Opportunities for improvement
    - Key project milestones

    Return as a JSON array with the following structure for each insight:
    [
        {{
            "title": "Clear, actionable title",
            "description": "Detailed explanation",
            "type": "action_item|decision|risk|opportunity|key_finding|blocker|milestone",
            "business_impact": "Impact on the business",
            "priority": "high|medium|low",
            "stakeholders": ["Affected parties"],
            "dependencies": ["What this depends on"]
        }}
    ]
    """

    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a business analyst. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.7
        )

        insights_text = response.choices[0].message.content.strip()
        if insights_text.startswith("```json"):
            insights_text = insights_text[7:]
        if insights_text.endswith("```"):
            insights_text = insights_text[:-3]

        insights = json.loads(insights_text)
        logger.info(f"Generated {len(insights)} insights for document: {doc_title[:50]}")
        return insights

    except Exception as e:
        logger.error(f"Error generating insights for {doc_title}: {e}")
        return []

async def process_documents_batch(documents: List[Dict[str, Any]]) -> int:
    """Process a batch of documents and save insights"""
    total_insights = 0

    for doc in documents:
        doc_title = doc.get('title', 'Unknown')[:50]

        # Generate insights
        insights = await generate_insights_for_document(doc)

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
                    'doc_title': doc_title,
                    'document_date': doc.get('date'),
                    'metadata': {
                        'priority': insight.get('priority', 'medium'),
                        'generated_at': datetime.now().isoformat(),
                        'auto_generated': True
                    }
                }

                supabase.table('document_insights').insert(insight_data).execute()
                total_insights += 1

            except Exception as e:
                logger.error(f"Error saving insight: {e}")

    return total_insights

async def main():
    """Main function to process documents without insights"""
    logger.info("=" * 60)
    logger.info("AUTOMATED INSIGHTS GENERATION STARTED")
    logger.info("=" * 60)

    # Get statistics
    total_docs = supabase.table('document_metadata')\
        .select('id', count='exact')\
        .not_.is_('content', 'null')\
        .execute()

    # Get documents that already have insights
    insights_result = supabase.table('document_insights')\
        .select('document_id')\
        .execute()

    docs_with_insights = set(insight['document_id'] for insight in insights_result.data) if insights_result.data else set()

    logger.info(f"Total documents: {total_docs.count}")
    logger.info(f"Documents with insights: {len(docs_with_insights)}")
    logger.info(f"Documents to process: {total_docs.count - len(docs_with_insights)}")

    # Get documents without insights
    all_docs_result = supabase.table('document_metadata')\
        .select('id, title, content, date, participants, summary')\
        .not_.is_('content', 'null')\
        .order('created_at', desc=False)\
        .execute()

    # Filter to only documents without insights
    documents_to_process = [
        doc for doc in all_docs_result.data
        if doc['id'] not in docs_with_insights
    ][:MAX_DOCUMENTS_PER_RUN]

    if not documents_to_process:
        logger.info("✅ All documents have insights. Nothing to process.")
        return

    logger.info(f"Processing {len(documents_to_process)} documents in batches of {BATCH_SIZE}")

    # Process in batches
    total_insights_generated = 0
    processed_count = 0

    for i in range(0, len(documents_to_process), BATCH_SIZE):
        batch = documents_to_process[i:i + BATCH_SIZE]
        logger.info(f"\nProcessing batch {i//BATCH_SIZE + 1} ({len(batch)} documents)")

        try:
            insights_count = await process_documents_batch(batch)
            total_insights_generated += insights_count
            processed_count += len(batch)
            logger.info(f"Batch complete: {insights_count} insights generated")

        except Exception as e:
            logger.error(f"Error processing batch: {e}")

        # Small delay between batches to avoid rate limits
        if i + BATCH_SIZE < len(documents_to_process):
            await asyncio.sleep(2)

    # Final statistics
    logger.info("=" * 60)
    logger.info("AUTOMATED INSIGHTS GENERATION COMPLETE")
    logger.info(f"Documents processed: {processed_count}")
    logger.info(f"Total insights generated: {total_insights_generated}")
    logger.info(f"Average insights per document: {total_insights_generated/processed_count:.1f}" if processed_count > 0 else "N/A")
    logger.info("=" * 60)

    # Send notification if configured (optional)
    if os.getenv('SLACK_WEBHOOK_URL'):
        send_slack_notification(processed_count, total_insights_generated)

def send_slack_notification(docs_processed: int, insights_generated: int):
    """Send a Slack notification about the run (optional)"""
    import requests

    webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    if not webhook_url:
        return

    message = {
        "text": f"📊 Insights Generation Complete",
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Insights Generation Complete*\n"
                           f"• Documents processed: {docs_processed}\n"
                           f"• Insights generated: {insights_generated}\n"
                           f"• Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
                }
            }
        ]
    }

    try:
        requests.post(webhook_url, json=message)
    except Exception as e:
        logger.error(f"Failed to send Slack notification: {e}")

if __name__ == "__main__":
    asyncio.run(main())