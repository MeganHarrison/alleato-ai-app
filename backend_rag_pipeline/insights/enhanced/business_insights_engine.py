"""
Enhanced Business Insights Engine

Advanced AI-powered insights generation for business documents using GPT models.
Generates high-quality, actionable insights that map to the sophisticated document_insights schema.
"""

import os
import re
import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio
from decimal import Decimal

from openai import AsyncOpenAI
from supabase import Client

logger = logging.getLogger(__name__)


class BusinessInsightType(Enum):
    """Business-focused insight types that align with strategic decision making."""
    ACTION_ITEM = "action_item"
    DECISION = "decision"
    RISK = "risk"
    OPPORTUNITY = "opportunity"
    MILESTONE = "milestone"
    BLOCKER = "blocker"
    DEPENDENCY = "dependency"
    BUDGET_IMPACT = "budget_impact"
    TIMELINE_CHANGE = "timeline_change"
    STAKEHOLDER_CONCERN = "stakeholder_concern"
    TECHNICAL_DEBT = "technical_debt"
    RESOURCE_NEED = "resource_need"
    COMPLIANCE_ISSUE = "compliance_issue"
    STRATEGIC_PIVOT = "strategic_pivot"
    PERFORMANCE_METRIC = "performance_metric"


class BusinessSeverity(Enum):
    """Business impact severity levels."""
    CRITICAL = "critical"    # Immediate action required, business-stopping
    HIGH = "high"           # Urgent attention needed, significant impact
    MEDIUM = "medium"       # Important but not urgent, moderate impact
    LOW = "low"            # Nice to have, minimal impact


@dataclass
class EnhancedBusinessInsight:
    """Sophisticated business insight that maps to document_insights schema."""
    # Core fields
    document_id: str
    project_id: Optional[int]
    insight_type: str
    title: str
    description: str
    confidence_score: float
    generated_by: str = "gpt-4o-mini"
    doc_title: Optional[str] = None
    
    # Business impact fields
    severity: str = "medium"
    business_impact: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[str] = None  # YYYY-MM-DD format
    financial_impact: Optional[Decimal] = None
    urgency_indicators: Optional[List[str]] = None
    resolved: bool = False
    
    # Date field - NEW!
    document_date: Optional[str] = None  # YYYY-MM-DD format - when document/meeting occurred
    
    # Context and relationships
    source_meetings: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    stakeholders_affected: Optional[List[str]] = None
    exact_quotes: Optional[List[str]] = None
    numerical_data: Optional[Dict[str, Any]] = None
    critical_path_impact: bool = False
    cross_project_impact: Optional[List[int]] = None
    
    # Metadata
    metadata: Optional[Dict[str, Any]] = None
    
    def to_database_dict(self) -> Dict[str, Any]:
        """Convert to database-compatible dictionary."""
        
        # Helper function to ensure arrays are properly formatted
        def ensure_array(value):
            if value is None:
                return None
            if isinstance(value, list):
                return value
            if isinstance(value, str):
                # If it's a string that looks like an array element, wrap it in a list
                return [value]
            return value
        
        data = {
            'document_id': self.document_id,
            'project_id': self.project_id,
            'insight_type': self.insight_type,
            'title': self.title,
            'description': self.description,
            'confidence_score': float(self.confidence_score),
            'generated_by': self.generated_by,
            'doc_title': self.doc_title,
            'severity': self.severity,
            'business_impact': self.business_impact,
            'assignee': self.assignee,
            'due_date': self.due_date,
            'financial_impact': float(self.financial_impact) if self.financial_impact else None,
            'urgency_indicators': ensure_array(self.urgency_indicators),
            'resolved': self.resolved,
            # Date field
            'document_date': self.document_date,
            'source_meetings': ensure_array(self.source_meetings),
            'dependencies': ensure_array(self.dependencies),
            'stakeholders_affected': ensure_array(self.stakeholders_affected),
            'exact_quotes': ensure_array(self.exact_quotes),
            'numerical_data': self.numerical_data,
            'critical_path_impact': self.critical_path_impact,
            'cross_project_impact': ensure_array(self.cross_project_impact),
            'metadata': self.metadata or {},
            'created_at': datetime.now().isoformat()
        }
        return data


class BusinessInsightsEngine:
    """
    Advanced AI engine for generating sophisticated business insights from documents.
    
    Uses GPT models with carefully crafted prompts to extract actionable business intelligence
    that executives and project managers can immediately act upon.
    """
    
    def __init__(self, supabase: Client, openai_client: Optional[AsyncOpenAI] = None):
        self.supabase = supabase
        
        # Initialize OpenAI client
        if openai_client is None:
            api_key = os.getenv('LLM_API_KEY') or os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("LLM_API_KEY or OPENAI_API_KEY environment variable is required")
            self.openai_client = AsyncOpenAI(api_key=api_key)
        else:
            self.openai_client = openai_client
        
        # Use GPT-4o-mini for superior insight quality
        self.model = os.getenv('LLM_CHOICE', 'gpt-4o-mini')
        
        # Business context configuration
        self.business_context_prompt = self._load_business_context()
        
    def _load_business_context(self) -> str:
        """Load or generate business context for better insights."""
        return """
        You are analyzing business documents for a professional services consulting firm.
        Focus on extracting insights that directly impact:
        - Project delivery and timelines
        - Financial performance and budget management
        - Risk management and mitigation
        - Stakeholder relationships and communication
        - Resource allocation and team performance
        - Strategic decision making
        - Operational efficiency improvements
        """
        
    async def extract_business_insights(
        self,
        document_id: str,
        content: str,
        title: str = "",
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[EnhancedBusinessInsight]:
        """
        Extract sophisticated business insights from document content.
        
        Uses advanced prompting techniques with GPT models to identify actionable
        business intelligence that maps to the document_insights schema.
        """
        
        if not content or len(content.strip()) < 50:
            logger.info(f"Content too short for meaningful insights: {document_id}")
            return []
            
        metadata = metadata or {}
        
        # Analyze document type for context-specific processing
        doc_analysis = await self._analyze_document_type(content, title, metadata)
        
        # Extract insights using specialized prompts based on document type
        raw_insights = await self._extract_insights_with_gpt(
            content, title, metadata, doc_analysis
        )
        
        # Convert to structured insights
        structured_insights = []
        for raw_insight in raw_insights:
            try:
                insight = self._convert_to_structured_insight(
                    raw_insight, document_id, title, metadata
                )
                if insight:
                    structured_insights.append(insight)
            except Exception as e:
                logger.warning(f"Failed to convert insight: {e}")
                continue
        
        # Post-process for quality and business relevance
        filtered_insights = self._filter_and_rank_insights(structured_insights)
        
        logger.info(f"Extracted {len(filtered_insights)} business insights from {document_id}")
        return filtered_insights
    
    async def _analyze_document_type(
        self, 
        content: str, 
        title: str, 
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze document to determine type and appropriate extraction strategy."""
        
        # Quick analysis prompt
        analysis_prompt = f"""
        Analyze this document and classify its type and business context:
        
        Title: {title}
        Content preview: {content[:1000]}...
        
        Return JSON with:
        - document_type: meeting_transcript, project_plan, status_report, proposal, contract, email, etc.
        - business_domain: technology, consulting, finance, marketing, operations, etc.
        - urgency_level: low, medium, high, critical
        - key_stakeholders: list of roles/people mentioned
        - contains_decisions: boolean
        - contains_action_items: boolean
        - contains_financial_data: boolean
        - contains_timeline_info: boolean
        - project_references: list of project names/IDs mentioned
        """
        
        try:
            # Use appropriate parameters for different models
            completion_params = {
                "model": self.model,
                "messages": [{"role": "user", "content": analysis_prompt}]
            }
            
            # Handle model-specific parameters
            if "gpt-5" in self.model.lower():
                completion_params["max_completion_tokens"] = 800
                # GPT-5 only supports default temperature of 1
            else:
                completion_params["max_tokens"] = 800
                completion_params["temperature"] = 0.1
            
            response = await self.openai_client.chat.completions.create(**completion_params)
            
            analysis_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', analysis_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            else:
                try:
                    return json.loads(analysis_text)
                except:
                    # Fallback analysis
                    return self._fallback_document_analysis(content, title)
                    
        except Exception as e:
            logger.warning(f"Document analysis failed: {e}")
            return self._fallback_document_analysis(content, title)
    
    def _fallback_document_analysis(self, content: str, title: str) -> Dict[str, Any]:
        """Fallback document analysis using pattern matching."""
        title_lower = title.lower()
        content_lower = content.lower()
        
        # Document type detection
        if any(word in title_lower for word in ['meeting', 'call', 'standup', 'sync']):
            doc_type = "meeting_transcript"
        elif any(word in title_lower for word in ['plan', 'roadmap', 'schedule']):
            doc_type = "project_plan"
        elif any(word in title_lower for word in ['status', 'update', 'report']):
            doc_type = "status_report"
        elif any(word in title_lower for word in ['proposal', 'sow', 'statement']):
            doc_type = "proposal"
        else:
            doc_type = "general_document"
        
        # Extract stakeholders
        stakeholder_patterns = [
            r'\b([A-Z][a-z]+ [A-Z][a-z]+)\b',  # Full names
            r'\b([A-Z][a-z]+):\s',              # Speaker patterns
        ]
        
        stakeholders = set()
        for pattern in stakeholder_patterns:
            matches = re.findall(pattern, content)
            stakeholders.update(matches[:10])  # Limit to 10
        
        return {
            'document_type': doc_type,
            'business_domain': 'consulting',
            'urgency_level': 'medium',
            'key_stakeholders': list(stakeholders),
            'contains_decisions': 'decision' in content_lower or 'decided' in content_lower,
            'contains_action_items': 'action' in content_lower or 'todo' in content_lower,
            'contains_financial_data': '$' in content or 'budget' in content_lower,
            'contains_timeline_info': 'deadline' in content_lower or 'due' in content_lower,
            'project_references': []
        }
    
    async def _extract_insights_with_gpt(
        self,
        content: str,
        title: str,
        metadata: Dict[str, Any],
        doc_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Extract insights using GPT with sophisticated business prompting."""
        
        # Build context-aware system prompt with BALANCED quality requirements
        system_prompt = f"""
        You are an elite business intelligence analyst extracting the most important insights.
        
        EXTRACTION REQUIREMENTS:
        1. Extract MAXIMUM 5 insights per document (target: 3-4)
        2. Focus on insights that require executive attention or action
        3. Include significant business impacts (revenue, costs, risks, decisions)
        4. Ignore routine operational details unless they indicate major problems
        5. Each insight must be unique and actionable
        
        QUALITY STANDARDS:
        - Insights should be suitable for executive summary
        - Must affect business objectives, not just operational details
        - Minimum confidence: 0.7 (moderately confident or higher)
        - Include specific financial impacts, risks, or timeline issues
        
        {self.business_context_prompt}
        
        Document Context:
        - Type: {doc_analysis.get('document_type', 'unknown')}
        - Domain: {doc_analysis.get('business_domain', 'business')}
        - Urgency: {doc_analysis.get('urgency_level', 'medium')}
        - Key Stakeholders: {', '.join(doc_analysis.get('key_stakeholders', []))}
        
        EXTRACTION FOCUS:
        1. PRIORITIZE: Major decisions, significant risks, budget impacts, timeline changes, critical blockers
        2. INCLUDE: Action items with clear business impact, financial implications, strategic changes
        3. AVOID: Routine updates, meeting logistics, obvious information, minor operational details
        4. Target confidence: 0.7-1.0 (be realistic about confidence levels)
        
        For each insight, provide:
        - insight_type: {[t.value for t in BusinessInsightType]}
        - title: Executive-level summary (max 80 chars)
        - description: Business impact and recommended actions (max 300 chars)
        - business_impact: Specific impact on business objectives
        - severity: critical/high/medium (avoid 'low' unless truly minor)
        - confidence_score: 0.7-1.0 (be realistic, not overly conservative)
        - assignee: Specific person mentioned (if any)
        - due_date: YYYY-MM-DD format if timeline mentioned
        - document_date: YYYY-MM-DD format when this meeting/document occurred
        - financial_impact: Numeric value if money mentioned (positive or negative)
        - urgency_indicators: List of phrases that indicate urgency
        - stakeholders_affected: People/roles impacted
        - exact_quotes: Verbatim text that supports this insight
        - numerical_data: Any numbers, percentages, or metrics mentioned
        - critical_path_impact: true if affects project critical path
        - dependencies: Other tasks/projects this depends on
        
        Return JSON array of insights. Focus on business value over perfection.
        """
        
        # Prepare content for analysis (truncate if too long)
        max_content_length = 12000  # Leave room for prompts
        if len(content) > max_content_length:
            content = content[:max_content_length] + "\n\n[Content truncated...]"
        
        user_prompt = f"""
        Document Title: {title}
        
        Document Content:
        {content}
        
        Extract all business-critical insights from this document. Focus on actionable intelligence
        that a CEO, project manager, or department head could immediately act upon.
        """
        
        try:
            # Use appropriate parameters for different models
            completion_params = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            }
            
            # Handle model-specific parameters
            if "gpt-5" in self.model.lower():
                completion_params["max_completion_tokens"] = 6000
                # GPT-5 only supports default temperature of 1
            else:
                completion_params["max_tokens"] = 6000
                completion_params["temperature"] = 0.1  # Low temperature for consistent, factual extraction
            
            response = await self.openai_client.chat.completions.create(**completion_params)
            
            response_text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            return self._parse_insights_json(response_text)
            
        except Exception as e:
            logger.error(f"GPT insights extraction failed: {e}")
            return []
    
    def _parse_insights_json(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse insights JSON from GPT response with error recovery."""
        
        # Log the response for debugging
        logger.info(f"GPT Response (first 200 chars): {response_text[:200]}...")
        
        try:
            # Try direct JSON parsing first
            insights = json.loads(response_text)
            if isinstance(insights, list):
                logger.info(f"Direct JSON parsing successful: {len(insights)} insights")
                return insights
            elif isinstance(insights, dict) and 'insights' in insights:
                logger.info(f"Found insights in dict wrapper: {len(insights['insights'])} insights")
                return insights['insights']
            else:
                logger.warning("Direct JSON parsing returned unexpected format")
                return []
                
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks (most common case)
            json_patterns = [
                r'```json\s*([\s\S]*?)\s*```',  # ```json ... ```
                r'```\s*([\s\S]*?)\s*```',     # ``` ... ``` 
                r'\[\s*\{[\s\S]*?\}\s*\]'     # Find any array of objects
            ]
            
            for pattern in json_patterns:
                json_match = re.search(pattern, response_text, re.DOTALL)
                if json_match:
                    try:
                        # Extract the matched text
                        if len(json_match.groups()) > 0:
                            json_text = json_match.group(1).strip()
                        else:
                            json_text = json_match.group(0).strip()
                        
                        # Parse the extracted JSON
                        parsed = json.loads(json_text)
                        
                        if isinstance(parsed, list) and len(parsed) > 0:
                            # Validate that each item is a dictionary
                            valid_insights = []
                            for item in parsed:
                                if isinstance(item, dict):
                                    valid_insights.append(item)
                                else:
                                    logger.warning(f"Skipping non-dict insight: {type(item)}")
                            
                            if valid_insights:
                                logger.info(f"Successfully parsed {len(valid_insights)} valid insights from pattern: {pattern[:20]}...")
                                return valid_insights
                        
                        logger.warning(f"Pattern {pattern[:20]}... matched but didn't return valid insights")
                        
                    except json.JSONDecodeError as e:
                        logger.warning(f"JSON decode failed for pattern {pattern[:20]}...: {e}")
                        continue
            
            # If no JSON found, try to create insights from structured text
            logger.warning("No valid JSON found, attempting text parsing...")
            return self._parse_insights_from_text(response_text)
    
    def _parse_insights_from_text(self, response_text: str) -> List[Dict[str, Any]]:
        """Fallback: Parse insights from structured text when JSON parsing fails."""
        insights = []
        
        try:
            # Look for insight patterns in the text
            lines = response_text.split('\n')
            current_insight = {}
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Look for key-value patterns
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip().lower().replace(' ', '_')
                    value = value.strip().strip('"\'')
                    
                    if key in ['type', 'insight_type']:
                        if current_insight:  # Save previous insight
                            insights.append(current_insight)
                        current_insight = {'insight_type': value}
                    elif key in ['title']:
                        current_insight['title'] = value
                    elif key in ['description']:
                        current_insight['description'] = value
                    elif key in ['severity', 'priority']:
                        current_insight['severity'] = value
                    elif key in ['confidence', 'confidence_score']:
                        try:
                            current_insight['confidence_score'] = float(value)
                        except:
                            current_insight['confidence_score'] = 0.7
                    elif key in ['assignee', 'assigned_to']:
                        current_insight['assignee'] = value
                    elif key in ['financial_impact']:
                        try:
                            # Extract number from financial impact
                            numbers = re.findall(r'[\d,]+', value.replace('$', '').replace(',', ''))
                            if numbers:
                                current_insight['financial_impact'] = float(numbers[0])
                        except:
                            pass
            
            # Add the last insight
            if current_insight and 'title' in current_insight:
                insights.append(current_insight)
            
            # If we still don't have insights, create some basic ones from key content
            if not insights:
                insights = self._create_fallback_insights(response_text)
                
        except Exception as e:
            logger.warning(f"Text parsing failed: {e}")
            insights = self._create_fallback_insights(response_text)
        
        logger.info(f"Text parsing extracted {len(insights)} insights")
        return insights
    
    def _create_fallback_insights(self, response_text: str) -> List[Dict[str, Any]]:
        """Create basic insights when all parsing fails."""
        insights = []
        
        # Look for key business terms and create basic insights
        text_lower = response_text.lower()
        
        if '$' in response_text or 'budget' in text_lower or 'cost' in text_lower:
            insights.append({
                'insight_type': 'budget_impact',
                'title': 'Financial Impact Identified',
                'description': 'Document contains financial implications that require review.',
                'severity': 'medium',
                'confidence_score': 0.6
            })
        
        if any(word in text_lower for word in ['urgent', 'critical', 'emergency', 'immediate']):
            insights.append({
                'insight_type': 'risk',
                'title': 'Urgent Issue Identified', 
                'description': 'Document contains urgent or critical issues requiring attention.',
                'severity': 'high',
                'confidence_score': 0.7
            })
        
        if any(word in text_lower for word in ['action', 'todo', 'task', 'deadline']):
            insights.append({
                'insight_type': 'action_item',
                'title': 'Action Items Identified',
                'description': 'Document contains action items or tasks that need to be completed.',
                'severity': 'medium', 
                'confidence_score': 0.6
            })
        
        return insights
    
    def _convert_to_structured_insight(
        self,
        raw_insight: Dict[str, Any],
        document_id: str,
        doc_title: str,
        metadata: Dict[str, Any]
    ) -> Optional[EnhancedBusinessInsight]:
        """Convert raw GPT insight to structured EnhancedBusinessInsight."""
        
        try:
            # Extract and validate required fields
            insight_type = raw_insight.get('insight_type', 'action_item')
            title = raw_insight.get('title', '').strip()
            description = raw_insight.get('description', '').strip()
            
            if not title or not description:
                return None
            
            # Parse financial impact
            financial_impact = None
            if raw_insight.get('financial_impact'):
                try:
                    # Handle various formats: "$1000", "1000", "-500", etc.
                    financial_str = str(raw_insight['financial_impact']).replace('$', '').replace(',', '')
                    financial_impact = Decimal(financial_str)
                except:
                    pass
            
            # Parse due date
            due_date = None
            if raw_insight.get('due_date'):
                due_date_str = str(raw_insight['due_date'])
                # Validate date format (YYYY-MM-DD)
                if re.match(r'\d{4}-\d{2}-\d{2}', due_date_str):
                    due_date = due_date_str
            
            # Parse document date (works for meetings, docs, any content)
            document_date = None
            
            # Try to get from insight response first
            if raw_insight.get('document_date'):
                date_str = str(raw_insight['document_date'])
                if re.match(r'\d{4}-\d{2}-\d{2}', date_str):
                    document_date = date_str
            
            # If not provided by AI, try to extract from document title
            if not document_date:
                document_date = self._extract_date_from_title(doc_title)
            
            # Extract project ID from metadata or title
            project_id = metadata.get('project_id')
            if not project_id:
                # Try to extract from document title or content
                project_patterns = [
                    r'project[_\s]+(\d+)',
                    r'proj[_\s]+(\d+)',
                    r'#(\d+)'
                ]
                for pattern in project_patterns:
                    match = re.search(pattern, f"{doc_title} {description}", re.IGNORECASE)
                    if match:
                        try:
                            project_id = int(match.group(1))
                            break
                        except:
                            pass
            
            insight = EnhancedBusinessInsight(
                document_id=document_id,
                project_id=project_id,
                insight_type=insight_type,
                title=title[:100],  # Ensure max length
                description=description[:500],  # Ensure max length
                confidence_score=float(raw_insight.get('confidence_score', 0.7)),
                doc_title=doc_title,
                severity=raw_insight.get('severity', 'medium'),
                business_impact=raw_insight.get('business_impact', ''),
                assignee=raw_insight.get('assignee'),
                due_date=due_date,
                document_date=document_date,
                financial_impact=financial_impact,
                urgency_indicators=raw_insight.get('urgency_indicators', []),
                resolved=False,
                source_meetings=[doc_title] if 'meeting' in doc_title.lower() else None,
                dependencies=raw_insight.get('dependencies', []),
                stakeholders_affected=raw_insight.get('stakeholders_affected', []),
                exact_quotes=raw_insight.get('exact_quotes', []),
                numerical_data=raw_insight.get('numerical_data'),
                critical_path_impact=bool(raw_insight.get('critical_path_impact', False)),
                cross_project_impact=raw_insight.get('cross_project_impact'),
                metadata={
                    'original_metadata': metadata,
                    'extraction_timestamp': datetime.now().isoformat(),
                    'model_used': self.model,
                    'confidence_factors': raw_insight.get('confidence_factors', [])
                }
            )
            
            return insight
            
        except Exception as e:
            logger.warning(f"Failed to convert raw insight to structured: {e}")
            return None
    
    def _filter_and_rank_insights(
        self, 
        insights: List[EnhancedBusinessInsight]
    ) -> List[EnhancedBusinessInsight]:
        """Aggressively filter and rank insights - MAXIMUM 5 per document."""
        
        if not insights:
            return []
        
        # AGGRESSIVE quality filtering
        high_quality_insights = []
        
        for insight in insights:
            # BALANCED quality criteria (less aggressive than before)
            if (
                # Moderate confidence threshold
                insight.confidence_score >= 0.7 and
                
                # Reasonable content requirements
                len(insight.title) >= 10 and  # Reduced from 15
                len(insight.description) >= 20 and  # Reduced from 30
                
                # Valid insight types
                insight.insight_type in [t.value for t in BusinessInsightType] and
                
                # Allow low severity if it has other value
                (insight.severity in ['critical', 'high', 'medium'] or 
                 insight.financial_impact or insight.critical_path_impact) and
                
                # Less aggressive routine filtering
                not self._is_obviously_routine(insight)
            ):
                high_quality_insights.append(insight)
        
        # Remove duplicates based on similarity
        deduplicated_insights = self._remove_duplicate_insights(high_quality_insights)
        
        # Rank by business impact
        severity_order = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        
        def insight_score(insight):
            severity_score = severity_order.get(insight.severity, 1)
            confidence_score = insight.confidence_score
            urgency_score = 1.3 if insight.urgency_indicators else 1.0
            financial_score = 1.5 if insight.financial_impact else 1.0
            critical_path_score = 2.0 if insight.critical_path_impact else 1.0
            
            return severity_score * confidence_score * urgency_score * financial_score * critical_path_score
        
        # Sort by score (highest first)
        ranked_insights = sorted(deduplicated_insights, key=insight_score, reverse=True)
        
        # STRICT LIMIT: Maximum 5 insights per document (prefer 2-3)
        max_insights = 5
        if len(ranked_insights) > max_insights:
            logger.info(f"Limiting insights from {len(ranked_insights)} to {max_insights} highest-quality ones")
        
        return ranked_insights[:max_insights]
    
    def _is_obviously_routine(self, insight: EnhancedBusinessInsight) -> bool:
        """Filter out only obviously routine insights (less aggressive)."""
        
        # Only filter the most obvious routine phrases
        obvious_routine = [
            'meeting held', 'meeting scheduled', 'attendees present',
            'agenda reviewed', 'minutes taken', 'next meeting',
            'will follow up', 'will check back'
        ]
        
        text_to_check = (insight.title + ' ' + insight.description).lower()
        
        # Only reject if it's clearly routine AND has no business value
        for indicator in obvious_routine:
            if indicator in text_to_check:
                # But keep it if it has significant business impact
                if (insight.financial_impact or insight.critical_path_impact or 
                   insight.severity == 'critical' or insight.urgency_indicators):
                    return False  # Keep it despite routine language
                return True  # Reject routine insight
        
        return False  # Not obviously routine
    
    def _remove_duplicate_insights(
        self, 
        insights: List[EnhancedBusinessInsight]
    ) -> List[EnhancedBusinessInsight]:
        """Remove duplicate or highly similar insights."""
        
        if len(insights) <= 1:
            return insights
        
        unique_insights = []
        
        for insight in insights:
            is_duplicate = False
            
            for existing in unique_insights:
                # Check for similar titles (>70% similarity)
                title_similarity = self._calculate_similarity(insight.title, existing.title)
                
                # Check for similar descriptions  
                desc_similarity = self._calculate_similarity(insight.description, existing.description)
                
                # Consider duplicate if very similar
                if title_similarity > 0.7 or desc_similarity > 0.8:
                    # Keep the higher-confidence one
                    if insight.confidence_score > existing.confidence_score:
                        unique_insights.remove(existing)
                        unique_insights.append(insight)
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                unique_insights.append(insight)
        
        return unique_insights
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two text strings (0-1)."""
        if not text1 or not text2:
            return 0.0
        
        # Simple word-based similarity
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    async def save_insights_to_database(
        self, 
        insights: List[EnhancedBusinessInsight]
    ) -> List[str]:
        """Save insights to the document_insights table."""
        
        saved_ids = []
        
        for insight in insights:
            try:
                data = insight.to_database_dict()
                
                # Insert into document_insights table
                result = self.supabase.table('document_insights').insert(data).execute()
                
                if result.data and len(result.data) > 0:
                    insight_id = result.data[0]['id']
                    saved_ids.append(insight_id)
                    logger.info(f"Saved insight: {insight.title[:50]}...")
                else:
                    logger.warning(f"Failed to save insight: {insight.title}")
                    
            except Exception as e:
                logger.error(f"Error saving insight '{insight.title}': {e}")
                continue
        
        logger.info(f"Successfully saved {len(saved_ids)}/{len(insights)} insights to database")
        return saved_ids
    
    async def process_document(
        self,
        document_id: str,
        content: str,
        title: str = "",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Complete document processing pipeline: extract and save insights.
        
        Returns:
            Processing results including insight IDs and statistics
        """
        start_time = datetime.now()
        
        try:
            # Extract insights
            insights = await self.extract_business_insights(
                document_id=document_id,
                content=content,
                title=title,
                metadata=metadata
            )
            
            # Save to database
            saved_ids = []
            if insights:
                saved_ids = await self.save_insights_to_database(insights)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            result = {
                'success': True,
                'document_id': document_id,
                'insights_extracted': len(insights),
                'insights_saved': len(saved_ids),
                'insight_ids': saved_ids,
                'processing_time_seconds': processing_time,
                'insights_by_type': self._count_insights_by_type(insights),
                'insights_by_severity': self._count_insights_by_severity(insights)
            }
            
            logger.info(f"Document processing completed: {document_id} -> {len(saved_ids)} insights")
            return result
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            logger.error(f"Document processing failed for {document_id}: {e}")
            
            return {
                'success': False,
                'document_id': document_id,
                'insights_extracted': 0,
                'insights_saved': 0,
                'insight_ids': [],
                'processing_time_seconds': processing_time,
                'error': str(e)
            }
    
    def _count_insights_by_type(self, insights: List[EnhancedBusinessInsight]) -> Dict[str, int]:
        """Count insights by type for analytics."""
        counts = {}
        for insight in insights:
            counts[insight.insight_type] = counts.get(insight.insight_type, 0) + 1
        return counts
    
    def _count_insights_by_severity(self, insights: List[EnhancedBusinessInsight]) -> Dict[str, int]:
        """Count insights by severity for analytics."""
        counts = {}
        for insight in insights:
            counts[insight.severity] = counts.get(insight.severity, 0) + 1
        return counts
    
    def _extract_date_from_title(self, title: str) -> Optional[str]:
        """Extract document date from title or filename (works for meetings, docs, etc)."""
        if not title:
            return None
            
        # Common date patterns
        date_patterns = [
            # YYYY-MM-DD format
            r'(\d{4}-\d{2}-\d{2})',
            # MM/DD/YYYY or MM-DD-YYYY
            r'(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
            # Month DD, YYYY
            r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4})',
            # DD Month YYYY
            r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',
            # YYYY_MM_DD or YYYY.MM.DD
            r'(\d{4}[_.]\d{2}[_.]\d{2})'
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                # Convert to YYYY-MM-DD format
                normalized_date = self._normalize_date_string(date_str)
                if normalized_date:
                    return normalized_date
        
        return None
    
    def _normalize_date_string(self, date_str: str) -> Optional[str]:
        """Convert various date formats to YYYY-MM-DD."""
        try:
            # Already in YYYY-MM-DD format
            if re.match(r'\d{4}-\d{2}-\d{2}', date_str):
                return date_str
            
            # Handle YYYY_MM_DD or YYYY.MM.DD
            if re.match(r'\d{4}[_.]\d{2}[_.]\d{2}', date_str):
                return date_str.replace('_', '-').replace('.', '-')
            
            # Handle MM/DD/YYYY or MM-DD-YYYY
            if re.match(r'\d{1,2}[/-]\d{1,2}[/-]\d{4}', date_str):
                parts = re.split(r'[/-]', date_str)
                if len(parts) == 3:
                    month, day, year = parts
                    return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            
            # Handle Month DD, YYYY
            month_match = re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),\s+(\d{4})', date_str, re.IGNORECASE)
            if month_match:
                month_name, day, year = month_match.groups()
                month_map = {
                    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
                    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
                }
                month_num = month_map.get(month_name.lower()[:3])
                if month_num:
                    return f"{year}-{month_num}-{day.zfill(2)}"
            
            # Handle DD Month YYYY
            day_month_match = re.search(r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})', date_str, re.IGNORECASE)
            if day_month_match:
                day, month_name, year = day_month_match.groups()
                month_map = {
                    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
                    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
                }
                month_num = month_map.get(month_name.lower()[:3])
                if month_num:
                    return f"{year}-{month_num}-{day.zfill(2)}"
                    
        except Exception as e:
            logger.warning(f"Failed to normalize date '{date_str}': {e}")
        
        return None
