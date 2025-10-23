#!/usr/bin/env python3
"""
Clean test script to properly save document metadata from storage bucket files.
Extracts all metadata and stores it in the appropriate columns.
"""

import os
import re
import json
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(supabase_url, supabase_key)

def extract_metadata_from_content(content: str, filename: str):
    """
    Extract metadata from markdown file content.
    Looks for fireflies info, dates, participants, duration, etc.
    """
    metadata = {}

    # Extract date from filename (YYYY-MM-DD format at start)
    date_match = re.match(r'^(\d{4}-\d{2}-\d{2})', filename)
    if date_match:
        metadata['date'] = date_match.group(1)

    # Extract title from filename (everything after date)
    title_match = re.match(r'^\d{4}-\d{2}-\d{2}\s*-\s*(.+?)\.md$', filename)
    if title_match:
        metadata['title'] = title_match.group(1)
    else:
        metadata['title'] = filename.replace('.md', '')

    # Convert content to string if bytes
    if isinstance(content, bytes):
        content = content.decode('utf-8', errors='ignore')

    # Look for Fireflies.ai metadata in content
    fireflies_pattern = r'https?://app\.fireflies\.ai/view/([^/\s\)]+)'
    fireflies_match = re.search(fireflies_pattern, content)
    if fireflies_match:
        metadata['fireflies_id'] = fireflies_match.group(1)
        metadata['fireflies_link'] = fireflies_match.group(0)

    # Look for Google Drive links
    drive_pattern = r'https?://drive\.google\.com/[^\s]+'
    drive_match = re.search(drive_pattern, content)
    if drive_match:
        metadata['url'] = drive_match.group(0)

    # Extract participants (look for "Participants:" or "Attendees:")
    participants_pattern = r'(?:Participants?|Attendees?):\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]|\Z)'
    participants_match = re.search(participants_pattern, content, re.IGNORECASE)
    if participants_match:
        participants_text = participants_match.group(1)
        # Split by common delimiters and clean
        participants = re.split(r'[,;\n•\-*]', participants_text)
        participants = [p.strip() for p in participants if p.strip() and len(p.strip()) > 2]
        metadata['participants'] = participants[:10]  # Limit to 10 participants

    # Extract duration (look for patterns like "Duration: 45 minutes" or "45 min" or "**Duration**: 45 min")
    duration_patterns = [
        r'\*\*Duration\*\*:\s*(\d+)\s*(?:minutes?|mins?)',  # **Duration**: 45 min
        r'Duration:\s*(\d+)\s*(?:minutes?|mins?)',  # Duration: 45 minutes
        r'(?:Length|Time):\s*(\d+)\s*(?:minutes?|mins?|hours?|hrs?)'  # Time: 45 min
    ]

    for pattern in duration_patterns:
        duration_match = re.search(pattern, content, re.IGNORECASE)
        if duration_match:
            duration = int(duration_match.group(1))
            if 'hour' in duration_match.group(0).lower() or 'hr' in duration_match.group(0).lower():
                duration *= 60  # Convert hours to minutes
            metadata['duration_minutes'] = duration
            break

    # Extract action items
    action_items = []
    action_pattern = r'(?:Action Items?|To-?Do|Next Steps?):\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[A-Z]|\Z)'
    action_match = re.search(action_pattern, content, re.IGNORECASE)
    if action_match:
        action_text = action_match.group(1)
        items = re.split(r'\n[\-•*]|\d+\.', action_text)
        action_items = [item.strip() for item in items if item.strip() and len(item.strip()) > 5]
        metadata['action_items'] = action_items[:10]  # Limit to 10 items

    # Extract summary (first paragraph or executive summary)
    summary_pattern = r'(?:Summary|Overview|Executive Summary):\s*([^\n]+(?:\n[^\n]+){0,3})'
    summary_match = re.search(summary_pattern, content, re.IGNORECASE)
    if summary_match:
        metadata['summary'] = summary_match.group(1).strip()
    elif len(content) > 100:
        # Use first 500 characters as summary if no explicit summary found
        first_para = content.split('\n\n')[0] if '\n\n' in content else content[:500]
        metadata['summary'] = first_para[:500].strip()

    # Extract tags/keywords (look for hashtags or keywords section)
    tags = []
    # Look for hashtags
    hashtags = re.findall(r'#(\w+)', content)
    tags.extend(hashtags)
    # Look for keywords section
    keywords_pattern = r'(?:Keywords?|Tags?):\s*([^\n]+)'
    keywords_match = re.search(keywords_pattern, content, re.IGNORECASE)
    if keywords_match:
        keyword_text = keywords_match.group(1)
        keywords = re.split(r'[,;]', keyword_text)
        tags.extend([k.strip() for k in keywords if k.strip()])
    if tags:
        metadata['tags'] = list(set(tags[:10]))  # Unique tags, limit to 10

    # Determine category based on content and title
    category = 'meeting'  # default
    if 'design' in filename.lower() or 'design' in content.lower()[:500]:
        category = 'design'
    elif 'project' in filename.lower() or 'project' in content.lower()[:500]:
        category = 'project'
    elif 'weekly' in filename.lower() or 'standup' in filename.lower():
        category = 'recurring'
    elif 'training' in filename.lower() or 'onboarding' in filename.lower():
        category = 'training'
    metadata['category'] = category

    # Determine type
    if '.md' in filename:
        metadata['type'] = 'transcript'
    else:
        metadata['type'] = 'document'

    return metadata

def process_file(bucket_name: str, file_path: str):
    """
    Process a single file from storage bucket and save to document_metadata.
    """
    print(f"\n{'=' * 60}")
    print(f"Processing: {file_path}")
    print(f"{'=' * 60}")

    try:
        # Generate unique ID (bucket/path)
        file_id = f"{bucket_name}/{file_path}"

        # Download file content
        print("📥 Downloading file...")
        file_content = supabase.storage.from_(bucket_name).download(file_path)

        if not file_content:
            print("❌ Failed to download file")
            return False

        # Extract metadata from content
        print("🔍 Extracting metadata...")
        metadata = extract_metadata_from_content(file_content, file_path)

        # Get public URL for the storage bucket file
        public_url = supabase.storage.from_(bucket_name).get_public_url(file_path)

        # Convert content to string if bytes
        content_str = file_content.decode('utf-8', errors='ignore') if isinstance(file_content, bytes) else str(file_content)

        # Prepare record for document_metadata table
        record = {
            'id': file_id,
            'title': metadata.get('title', file_path),
            'url': public_url,  # Storage bucket URL
            'content': content_str,  # Full file content
            'date': metadata.get('date'),
            'type': metadata.get('type', 'document'),
            'source': 'supabase_storage',
            'summary': metadata.get('summary'),
            'participants': metadata.get('participants'),
            'tags': metadata.get('tags'),
            'category': metadata.get('category', 'meeting'),
            'storage_bucket_path': file_path,
            'fireflies_id': metadata.get('fireflies_id'),
            'fireflies_link': metadata.get('fireflies_link'),
            'duration_minutes': metadata.get('duration_minutes'),
            'action_items': metadata.get('action_items')
        }

        # Remove None values
        record = {k: v for k, v in record.items() if v is not None}

        # Display what we extracted (skip content field for display)
        print("\n📋 Extracted Metadata:")
        for key, value in record.items():
            if key == 'content':
                print(f"  {key}: {len(value)} characters")
            elif isinstance(value, list):
                print(f"  {key}: {value[:3]}..." if len(value) > 3 else f"  {key}: {value}")
            elif isinstance(value, str) and len(value) > 100:
                print(f"  {key}: {value[:100]}...")
            else:
                print(f"  {key}: {value}")

        # Check if record already exists
        existing = supabase.from_('document_metadata').select('id').eq('id', file_id).execute()

        if existing.data:
            # Update existing record
            print("\n🔄 Updating existing record...")
            result = supabase.from_('document_metadata').update(record).eq('id', file_id).execute()
            print("✅ Record updated successfully!")
        else:
            # Insert new record
            print("\n➕ Inserting new record...")
            result = supabase.from_('document_metadata').insert(record).execute()
            print("✅ Record inserted successfully!")

        return True

    except Exception as e:
        print(f"❌ Error processing file: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """
    Process ALL files from the meetings bucket.
    """
    print("\n" + "=" * 60)
    print("CLEAN METADATA EXTRACTION - Processing ALL Files")
    print("=" * 60)

    bucket_name = 'meetings'

    # Get list of ALL files from bucket (including subdirectories)
    all_files = []

    # Get files from root with pagination
    print("📂 Fetching root files...")
    offset = 0
    limit = 100
    while True:
        root_files = supabase.storage.from_(bucket_name).list(
            options={"limit": limit, "offset": offset}
        )
        if not root_files:
            break
        for f in root_files:
            if f.get('metadata'):
                all_files.append(f.get('name'))
        if len(root_files) < limit:
            break
        offset += limit
        print(f"  Fetched {len(all_files)} root files so far...")

    # Get files from transcripts subdirectory with pagination
    print("📂 Fetching transcript files...")
    offset = 0
    while True:
        transcript_files = supabase.storage.from_(bucket_name).list(
            path='transcripts',
            options={"limit": limit, "offset": offset}
        )
        if not transcript_files:
            break
        for f in transcript_files:
            if f.get('metadata'):
                all_files.append(f'transcripts/{f.get("name")}')
        if len(transcript_files) < limit:
            break
        offset += limit
        print(f"  Fetched {len(all_files)} total files so far...")

    if not all_files:
        print("❌ No files found in bucket")
        return

    # Sort by name (which includes date) in descending order
    all_files.sort(reverse=True)

    print(f"\nFound {len(all_files)} total files to process")
    print("-" * 60)

    # Process each file
    successful = 0
    failed = 0

    for i, filename in enumerate(all_files, 1):
        print(f"\n[{i}/{len(all_files)}] Processing: {filename}")
        if process_file(bucket_name, filename):
            successful += 1
        else:
            failed += 1

    # Summary
    print("\n" + "=" * 60)
    print("PROCESSING COMPLETE")
    print("=" * 60)
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")

    # Show final database stats
    print("\n📊 Database Summary:")
    total_records = supabase.from_('document_metadata').select('id', count='exact').execute()
    print(f"Total records in document_metadata: {total_records.count}")

    # Show sample of processed records
    print("\n📋 Sample of processed records:")
    recent = supabase.from_('document_metadata').select('id, date, title, fireflies_id').order('date', desc=True).limit(5).execute()
    for r in recent.data:
        print(f"  - {r['date']}: {r['title'][:50]}..." if r['title'] and len(r['title']) > 50 else f"  - {r['date']}: {r['title']}")

if __name__ == "__main__":
    main()