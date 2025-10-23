#!/usr/bin/env python3
"""
Simple test script to verify insights generation is working
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from openai import OpenAI

# Load environment
load_dotenv('../.env')

# Initialize clients
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)
openai_client = OpenAI(api_key=os.getenv('LLM_API_KEY'))

print("🚀 INSIGHTS GENERATION TEST")
print("=" * 60)

# Test 1: Check database connection
print("\n1️⃣ Testing database connection...")
try:
    result = supabase.table('document_metadata').select('count').limit(1).execute()
    print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Database error: {e}")
    sys.exit(1)

# Test 2: Check OpenAI API
print("\n2️⃣ Testing OpenAI API...")
try:
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Say 'API working'"}],
        max_tokens=10
    )
    print(f"✅ OpenAI API working: {response.choices[0].message.content}")
except Exception as e:
    print(f"❌ OpenAI API error: {e}")
    sys.exit(1)

# Test 3: Get a sample document
print("\n3️⃣ Getting sample document from document_metadata...")
docs_result = supabase.table('document_metadata')\
    .select('id, title, content')\
    .not_.is_('content', 'null')\
    .limit(1)\
    .execute()

if not docs_result.data:
    print("❌ No documents with content found")
    sys.exit(1)

doc = docs_result.data[0]
print(f"✅ Found document: {doc['title'][:50]}...")
print(f"   Content length: {len(doc['content'])} characters")

# Test 4: Generate a simple insight
print("\n4️⃣ Generating test insight...")
try:
    prompt = f"""
    Analyze this document excerpt and provide ONE key insight:

    Document: {doc['title']}
    Content: {doc['content'][:1000]}

    Respond with a JSON object:
    {{
        "title": "Brief title of the insight",
        "description": "One sentence description",
        "type": "action_item or decision or risk"
    }}
    """

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a business analyst. Respond only with valid JSON."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=200,
        temperature=0.7
    )

    insight_text = response.choices[0].message.content
    print(f"✅ Generated insight: {insight_text[:200]}")

    # Parse and save to database
    import json
    try:
        insight = json.loads(insight_text)

        # Save to document_insights table
        result = supabase.table('document_insights').insert({
            'document_id': doc['id'],
            'title': insight['title'],
            'description': insight['description'],
            'insight_type': insight.get('type', 'key_finding'),
            'confidence_score': 0.8,
            'business_impact': 'Test insight from script'
        }).execute()

        print(f"✅ Saved insight to database!")
        print(f"   Insight ID: {result.data[0]['id']}")

    except json.JSONDecodeError as e:
        print(f"⚠️  Could not parse JSON response: {e}")

except Exception as e:
    print(f"❌ Error generating insight: {e}")

print("\n✨ Test complete!")