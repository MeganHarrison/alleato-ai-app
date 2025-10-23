#!/usr/bin/env python3
"""
Intelligent Project Assignment

Uses AI to analyze content and automatically assign project_id based on:
- Title analysis
- Content analysis  
- Email addresses/domains
- Company names
- Project keywords
- Contextual clues
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from openai import AsyncOpenAI
import asyncio
import json

# Load environment
load_dotenv(Path(__file__).parent / '.env')
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))
openai_client = AsyncOpenAI(api_key=os.getenv('LLM_API_KEY'))

# Project definitions (you'd customize this)
PROJECT_DEFINITIONS = {
    101: {
        "name": "Westfield Collective",
        "keywords": ["westfield", "collective", "shopping center", "retail"],
        "emails": ["@westfield.com", "@collective.com"],
        "description": "Shopping center development project"
    },
    102: {
        "name": "Tech Startup Incubator", 
        "keywords": ["startup", "incubator", "tech", "innovation"],
        "emails": ["@techincubator.com"],
        "description": "Technology startup incubation program"
    },
    # Add your other 8 projects...
}

async def analyze_document_for_project(title: str, content: str) -> int:
    """Use AI to determine which project a document belongs to"""
    
    # Create project context for AI
    projects_context = ""
    for pid, info in PROJECT_DEFINITIONS.items():
        projects_context += f"Project {pid}: {info['name']} - {info['description']}\n"
        projects_context += f"  Keywords: {', '.join(info['keywords'])}\n"
        projects_context += f"  Associated emails: {', '.join(info['emails'])}\n\n"
    
    prompt = f"""
    Analyze this document and determine which project it belongs to based on the content, title, email addresses, and contextual clues.

    AVAILABLE PROJECTS:
    {projects_context}

    DOCUMENT TO ANALYZE:
    Title: {title}
    Content: {content[:2000]}...

    Return ONLY a JSON object with:
    {{
        "project_id": <number or null>,
        "confidence": <0.0-1.0>,
        "reasoning": "Brief explanation of why this project was chosen"
    }}

    If no clear project match, return project_id: null
    """
    
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.1
        )
        
        result = json.loads(response.choices[0].message.content.strip())
        return result
        
    except Exception as e:
        print(f"❌ AI analysis failed: {e}")
        return {"project_id": None, "confidence": 0.0, "reasoning": "Analysis failed"}

async def intelligent_project_assignment():
    """Analyze unassigned documents and suggest project assignments"""
    
    print("🤖 INTELLIGENT PROJECT ASSIGNMENT")
    print("=" * 40)
    
    # Get documents without project_id
    unassigned = supabase.table('documents').select('id, title, content, metadata').is_('project_id', 'null').limit(10).execute()
    
    if not unassigned.data:
        print("✅ All documents already have project assignments!")
        return
    
    print(f"📄 Found {len(unassigned.data)} unassigned documents")
    
    for doc in unassigned.data:
        title = doc.get('title') or doc.get('metadata', {}).get('file_title', 'Untitled')
        content = doc.get('content', '')
        
        if not content:
            continue
            
        print(f"\n🔍 Analyzing: {title}")
        
        # Use AI to analyze the document
        analysis = await analyze_document_for_project(title, content)
        
        project_id = analysis.get('project_id')
        confidence = analysis.get('confidence', 0.0)
        reasoning = analysis.get('reasoning', '')
        
        if project_id and confidence > 0.7:  # High confidence threshold
            project_name = PROJECT_DEFINITIONS.get(project_id, {}).get('name', f'Project {project_id}')
            print(f"   ✅ MATCH: {project_name} (confidence: {confidence:.1%})")
            print(f"   📝 Reasoning: {reasoning}")
            
            # Ask for confirmation
            confirm = input(f"   Assign to {project_name}? (y/n): ").strip().lower()
            if confirm == 'y':
                supabase.table('documents').update({'project_id': project_id}).eq('id', doc['id']).execute()
                print(f"   💾 Assigned to Project {project_id}")
            else:
                print(f"   ⏭️  Skipped")
        else:
            print(f"   ❓ No clear match (confidence: {confidence:.1%})")
            print(f"   📝 Reasoning: {reasoning}")

if __name__ == "__main__":
    print("🤖 AI-Powered Project Assignment")
    print("=" * 35)
    asyncio.run(intelligent_project_assignment())
