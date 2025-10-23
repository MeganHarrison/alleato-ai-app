#!/usr/bin/env python3
"""
Simple script to generate insights for meeting documents
"""

import os
import json
import asyncio
from dotenv import load_dotenv
from supabase import create_client
from openai import AsyncOpenAI

# Load environment variables
load_dotenv()

# Meeting document IDs we found earlier
MEETING_DOC_IDS = [
    '60a20021-5507-4eee-9ecc-c34eb6af8b60',  # Weekly Ops Update  
    '5d9986ef-17fa-484f-9a10-d675b237ff7f',  # Daily TB
    '6e2945ea-421f-439b-bdb9-4b6107ec9efa',  # Meeting with Jim Parker
    '9ec9abc2-26f3-43dd-8cb3-6fcf48a8ea96'   # Goodwill Bloomington Morning Meeting
]

async def generate_simple_insights(content: str, title: str) -> list:
    """Generate insights using OpenAI directly."""
    
    # Initialize OpenAI client with LLM_API_KEY
    openai_client = AsyncOpenAI(api_key=os.getenv('LLM_API_KEY'))
    
    prompt = f"""
    Analyze the following meeting transcript and extract key insights. Focus on:
    - Action items and next steps
    - Important decisions made
    - Key risks or concerns raised
    - Project milestones or deadlines mentioned
    - Budget or resource updates
    
    Meeting: {title}
    Content: {content[:4000]}...
    
    Return insights in JSON format as an array of objects with keys:
    - type: One of (action_item, decision, risk, milestone, budget_update, concern)
    - content: The insight description
    - confidence: Float between 0.0 and 1.0
    """
    
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert meeting analyst who extracts actionable insights from transcripts."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.1
        )
        
        result = response.choices[0].message.content
        
        # Try to parse JSON response
        try:
            insights = json.loads(result)
            if isinstance(insights, list):
                return insights
            else:
                # If not a list, wrap in a list
                return [{"type": "general", "content": result, "confidence": 0.8}]
        except json.JSONDecodeError:
            # If not valid JSON, create a simple insight
            return [{"type": "general", "content": result, "confidence": 0.8}]
            
    except Exception as e:
        print(f"Error generating insights: {e}")
        return []

async def main():
    # Initialize Supabase client
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))
    
    insights_created = 0
    
    for doc_id in MEETING_DOC_IDS:
        print(f'\nProcessing document: {doc_id}')
        
        try:
            # Get the document
            doc_result = supabase.table('documents').select('*').eq('id', doc_id).execute()
            if not doc_result.data:
                print(f'  Document not found: {doc_id}')
                continue
                
            doc = doc_result.data[0]
            content = doc.get('content', '')
            title = doc.get('title', 'Untitled')
            
            print(f'  Document: {title}')
            print(f'  Content length: {len(content)} characters')
            
            if len(content) < 100:
                print(f'  Content too short, skipping...')
                continue
            
            # Check if content looks like a meeting
            meeting_indicators = ['meeting', 'participants', 'duration', 'discussion', 'agenda']
            content_lower = content.lower()
            
            if not any(indicator in content_lower for indicator in meeting_indicators):
                print(f'  Content does not appear to be a meeting transcript, skipping...')
                continue
                
            print(f'  Generating insights...')
            
            # Generate insights
            insights = await generate_simple_insights(content, title)
            
            if insights:
                print(f'  Generated {len(insights)} insights')
                
                # Save each insight to the database using ai_insights table
                for insight in insights:
                    # Map insight type to valid values
                    insight_type = insight.get('type', 'concern').lower()
                    
                    insight_data = {
                        'insight_type': insight_type,
                        'title': f"{insight_type.replace('_', ' ').title()} from {title or 'Meeting'}",
                        'description': insight.get('content', ''),
                        'confidence_score': insight.get('confidence', 0.8),
                        'severity': 'medium',
                        'status': 'open',
                        'project_name': 'Manual Processing',
                        'document_id': doc_id,
                        'meeting_name': title or 'Untitled Meeting',
                        'meeting_date': '2025-09-18T00:00:00+00:00',
                        'resolved': 0,  # Use integer instead of boolean
                        'metadata': {
                            'generated_method': 'manual_script',
                            'generated_at': '2025-09-18',
                            'ai_model': 'gpt-3.5-turbo'
                        }
                    }
                    
                    try:
                        result = supabase.table('ai_insights').insert(insight_data).execute()
                        if result.data:
                            insights_created += 1
                            print(f'    ✓ Saved insight: {insight_type} - {insight_data["description"][:50]}...')
                    except Exception as e:
                        print(f'    ✗ Failed to save insight: {e}')
            else:
                print(f'  No insights generated for {doc_id}')
                
        except Exception as e:
            print(f'  Error processing {doc_id}: {e}')
    
    print(f'\n=== Summary ===')
    print(f'Total insights created: {insights_created}')
    
    # Check final status from ai_insights table
    ai_insights_result = supabase.table('ai_insights').select('id', count='exact').execute()
    
    ai_insights_count = ai_insights_result.count if ai_insights_result.count else 0
    
    print(f'Total ai_insights in database: {ai_insights_count}')
    
    return insights_created

if __name__ == "__main__":
    result = asyncio.run(main())
    print(f"Generated {result} new insights!")