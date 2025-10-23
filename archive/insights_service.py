"""
Insights Service for RAG Pipeline

Generates AI-driven insights from meeting transcripts and project documents,
integrated with the document processing pipeline.
"""

import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio
from pathlib import Path

from openai import AsyncOpenAI
from supabase import Client

logger = logging.getLogger(__name__)


class InsightType(Enum):
    """Types of insights that can be extracted from meetings."""
    ACTION_ITEM = "action_item"
    DECISION = "decision"
    RISK = "risk"
    MILESTONE = "milestone"
    BLOCKER = "blocker"
    DEPENDENCY = "dependency"
    BUDGET_UPDATE = "budget_update"
    TIMELINE_CHANGE = "timeline_change"
    STAKEHOLDER_FEEDBACK = "stakeholder_feedback"
    TECHNICAL_ISSUE = "technical_issue"
    OPPORTUNITY = "opportunity"
    CONCERN = "concern"


class InsightPriority(Enum):
    """Priority levels for insights."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class InsightStatus(Enum):
    """Status of insight items."""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


@dataclass
class ProjectInsight:
    """Structured representation of a project insight."""
    insight_type: str  # InsightType.value
    title: str
    description: str
    confidence_score: float
    priority: str  # InsightPriority.value
    status: str = "open"  # InsightStatus.value
    project_name: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None  # ISO format
    source_document_id: Optional[str] = None
    source_meeting_title: Optional[str] = None
    source_date: Optional[str] = None
    speakers: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    related_insights: Optional[List[str]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


class MeetingInsightsGenerator:
    """Service for extracting and managing project insights from meeting transcripts."""
    
    def __init__(self, supabase: Client, openai_client: AsyncOpenAI):
        self.supabase = supabase
        self.openai_client = openai_client
        self.model = os.getenv('LLM_CHOICE', 'gpt-4o-mini')
        
    async def extract_insights_from_meeting(
        self,
        document_id: str,
        title: str,
        content: str,
        metadata: Dict[str, Any]
    ) -> List[ProjectInsight]:
        """
        Extract structured insights from a meeting transcript.
        
        Args:
            document_id: Unique identifier for the document
            title: Meeting title
            content: Full meeting transcript content
            metadata: Document metadata including speakers, date, etc.
            
        Returns:
            List of ProjectInsight objects
        """
        
        # Detect if this is a meeting transcript
        if not self._is_meeting_transcript(title, content):
            logger.info(f"Document {document_id} does not appear to be a meeting transcript")
            return []
        
        # Extract basic meeting information
        meeting_info = self._extract_meeting_info(title, metadata)
        
        # Generate insights using LLM
        insights_data = await self._generate_insights_with_llm(content, meeting_info)
        
        # Convert to structured insights
        insights = []
        for insight_data in insights_data:
            try:
                insight = ProjectInsight(
                    insight_type=insight_data.get('type', 'action_item'),
                    title=insight_data.get('title', ''),
                    description=insight_data.get('description', ''),
                    confidence_score=float(insight_data.get('confidence', 0.7)),
                    priority=insight_data.get('priority', 'medium'),
                    project_name=insight_data.get('project_name'),
                    assigned_to=insight_data.get('assigned_to'),
                    due_date=insight_data.get('due_date'),
                    source_document_id=document_id,
                    source_meeting_title=title,
                    source_date=meeting_info.get('date'),
                    speakers=meeting_info.get('speakers'),
                    keywords=insight_data.get('keywords', []),
                    metadata={
                        'original_metadata': metadata,
                        'meeting_info': meeting_info,
                        'extraction_timestamp': datetime.now().isoformat()
                    }
                )
                insights.append(insight)
            except Exception as e:
                logger.warning(f"Failed to create insight from data {insight_data}: {e}")
                continue
                
        return insights

    def _is_meeting_transcript(self, title: str, content: str) -> bool:
        """Detect if content is a meeting transcript."""
        title_lower = title.lower()
        meeting_indicators = [
            'meeting', 'call', 'session', 'standup', 'sync', 'review', 
            'discussion', 'conference', 'huddle', 'briefing', 'kickoff'
        ]
        
        # Check title for meeting indicators
        if any(indicator in title_lower for indicator in meeting_indicators):
            return True
        
        # Check content for conversation patterns
        conversation_patterns = [
            r'\b[A-Z][a-zA-Z\s]+:\s',  # "John Doe: "
            r'\b[A-Z_]+\d*:\s',        # "SPEAKER_1: "
            r'^\[([^]]+)\]\s*([A-Z])', # "[10:30] Text"
            r'>\s*[A-Z][a-zA-Z\s]+:',  # "> John Doe:"
        ]
        
        speaker_matches = sum(len(re.findall(pattern, content, re.MULTILINE)) for pattern in conversation_patterns)
        total_lines = len([line for line in content.split('\n') if line.strip()])
        
        # If more than 15% of lines have speaker patterns, likely a transcript
        return total_lines > 0 and (speaker_matches / total_lines) > 0.15

    def _extract_meeting_info(self, title: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Extract meeting information from title and metadata."""
        meeting_info = {
            'title': title,
            'date': None,
            'speakers': [],
            'project_hints': []
        }
        
        # Extract date from metadata or title
        if 'created_at' in metadata:
            meeting_info['date'] = metadata['created_at']
        elif 'modified_at' in metadata:
            meeting_info['date'] = metadata['modified_at']
        
        # Extract speakers from content patterns
        meeting_info['speakers'] = self._extract_speakers_from_content(title + "\n" + str(metadata))
        
        # Extract project hints from title and metadata
        project_patterns = [
            r'project\s+([a-z0-9_-]+)',
            r'([A-Z][A-Z0-9_-]+)\s+project',
            r'#([a-z0-9_-]+)',
        ]
        
        text_to_search = f"{title} {json.dumps(metadata)}"
        for pattern in project_patterns:
            matches = re.findall(pattern, text_to_search, re.IGNORECASE)
            meeting_info['project_hints'].extend(matches)
        
        return meeting_info

    def _extract_speakers_from_content(self, content: str) -> List[str]:
        """Extract speaker names from meeting content."""
        speaker_patterns = [
            r'\b([A-Z][a-zA-Z\s]{2,30}):\s',  # "John Doe: "
            r'\b([A-Z_]+\d*):\s',              # "SPEAKER_1: "
            r'>\s*([A-Z][a-zA-Z\s]+):',        # "> John Doe:"
        ]
        
        speakers = set()
        for pattern in speaker_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                speaker = match.strip()
                if len(speaker) > 1 and speaker not in ['THE', 'AND', 'FOR']:
                    speakers.add(speaker)
        
        return list(speakers)[:10]  # Limit to 10 speakers

    async def _generate_insights_with_llm(self, content: str, meeting_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate insights using LLM."""
        
        system_prompt = """You are an expert project manager and meeting analyst. Extract actionable insights from meeting transcripts.

For each insight, provide:
- type: one of [action_item, decision, risk, milestone, blocker, dependency, budget_update, timeline_change, stakeholder_feedback, technical_issue, opportunity, concern]
- title: brief descriptive title (max 100 chars)
- description: detailed description (max 500 chars)
- confidence: float 0.0-1.0 indicating extraction confidence
- priority: one of [critical, high, medium, low]
- project_name: inferred project name if mentioned
- assigned_to: person assigned (if mentioned)
- due_date: ISO date if mentioned (YYYY-MM-DD)
- keywords: relevant keywords for searching

Focus on actionable items, decisions made, risks identified, and project milestones.
Return as JSON array."""

        user_prompt = f"""Meeting: {meeting_info.get('title', 'Unknown')}
Date: {meeting_info.get('date', 'Unknown')}
Speakers: {', '.join(meeting_info.get('speakers', []))}

Content:
{content[:8000]}  # Limit content to avoid token limits

Extract all actionable insights from this meeting transcript."""

        try:
            response = await self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=4000
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Try to parse JSON response
            try:
                insights_data = json.loads(response_text)
                if isinstance(insights_data, list):
                    return insights_data
                else:
                    logger.warning(f"Expected list, got {type(insights_data)}")
                    return []
            except json.JSONDecodeError:
                # Try to extract JSON from markdown code blocks
                json_match = re.search(r'```(?:json)?\s*(\[.*?\])\s*```', response_text, re.DOTALL)
                if json_match:
                    insights_data = json.loads(json_match.group(1))
                    return insights_data if isinstance(insights_data, list) else []
                else:
                    logger.warning(f"Could not parse insights JSON: {response_text[:200]}...")
                    return []
                    
        except Exception as e:
            logger.error(f"Failed to generate insights with LLM: {e}")
            return []

    async def save_insights_to_database(self, insights: List[ProjectInsight], user_id: str) -> List[str]:
        """
        Save insights to the database.
        
        Args:
            insights: List of ProjectInsight objects
            user_id: User ID for row-level security
            
        Returns:
            List of created insight IDs
        """
        created_ids = []
        
        for insight in insights:
            try:
                # Prepare data for database - map to ai_insights schema
                insight_data = {
                    'insight_type': insight.insight_type,
                    'title': insight.title,
                    'description': insight.description,
                    'confidence_score': insight.confidence_score,
                    'severity': insight.priority,  # Map priority to severity
                    'status': insight.status,
                    'project_name': insight.project_name,
                    'assigned_to': insight.assigned_to,
                    'due_date': insight.due_date,
                    'document_id': insight.source_document_id,  # Map to document_id
                    'meeting_name': insight.source_meeting_title,
                    'meeting_date': insight.source_date,
                    'metadata': insight.metadata,
                    'created_at': datetime.now().isoformat(),
                    'resolved': False,
                    'assignee': insight.assigned_to  # Duplicate for compatibility
                }
                
                # Insert into database
                result = self.supabase.table('ai_insights').insert(insight_data).execute()
                
                if result.data:
                    created_ids.append(result.data[0]['id'])
                    logger.info(f"Created insight: {insight.title}")
                else:
                    logger.warning(f"Failed to create insight: {insight.title}")
                    
            except Exception as e:
                logger.error(f"Failed to save insight {insight.title}: {e}")
                continue
        
        return created_ids

    async def process_document_for_insights(
        self, 
        document_id: str, 
        user_id: str,
        content: str = None
    ) -> List[str]:
        """
        Process a document and extract insights if it's a meeting transcript.
        
        Args:
            document_id: Document ID to process
            user_id: User ID for database operations
            content: Optional pre-loaded content
            
        Returns:
            List of created insight IDs
        """
        try:
            # Get document details if content not provided
            if content is None:
                doc_result = self.supabase.table('documents').select('*').eq('id', document_id).single().execute()
                if not doc_result.data:
                    logger.warning(f"Document {document_id} not found")
                    return []
                
                document = doc_result.data
                content = document.get('content', '')
                title = document.get('title', 'Untitled')
                metadata = document.get('metadata', {})
            else:
                # Use provided content with minimal metadata
                title = f"Document {document_id}"
                metadata = {}
            
            # Extract insights
            insights = await self.extract_insights_from_meeting(
                document_id=document_id,
                title=title,
                content=content,
                metadata=metadata
            )
            
            if not insights:
                logger.info(f"No insights extracted from document {document_id}")
                return []
            
            # Save insights to database
            created_ids = await self.save_insights_to_database(insights, user_id)
            
            logger.info(f"Processed document {document_id}: created {len(created_ids)} insights")
            return created_ids
            
        except Exception as e:
            logger.error(f"Failed to process document {document_id} for insights: {e}")
            return []