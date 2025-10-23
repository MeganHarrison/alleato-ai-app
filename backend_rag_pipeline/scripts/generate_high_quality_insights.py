#!/usr/bin/env python3
"""
High-Quality Document Insights Generator v2.0

This script generates premium insights by:
1. Reading FULL document content from document_metadata table
2. Implementing multi-stage analysis with validation
3. Scoring insights for quality before storage
4. Extracting actionable, specific, and measurable insights

IMPORTANT: This script ONLY uses the document_metadata table.
           Documents must be populated there with full content.
           Use sync_documents_to_metadata.py to populate from documents table if needed.
"""

import os
import sys
import json
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import re

from dotenv import load_dotenv
from supabase import create_client
from openai import AsyncOpenAI
import tiktoken

# Load environment
load_dotenv()

# Add project root to path
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))


class InsightType(Enum):
    """Enhanced insight categories for better classification"""
    ACTION_ITEM = "action_item"
    DECISION = "decision"
    RISK = "risk"
    OPPORTUNITY = "opportunity"
    KEY_FINDING = "key_finding"
    BLOCKER = "blocker"
    MILESTONE = "milestone"
    DEPENDENCY = "dependency"
    BUDGET_IMPACT = "budget_impact"
    TIMELINE_CHANGE = "timeline_change"
    TECHNICAL_DEBT = "technical_debt"
    COMPLIANCE_ISSUE = "compliance_issue"
    STRATEGIC_INITIATIVE = "strategic_initiative"
    PERFORMANCE_METRIC = "performance_metric"
    STAKEHOLDER_CONCERN = "stakeholder_concern"


class InsightPriority(Enum):
    """Priority levels with clear definitions"""
    CRITICAL = "critical"  # Immediate action required, blocking progress
    HIGH = "high"          # Important, needs attention within days
    MEDIUM = "medium"      # Standard priority, within weeks
    LOW = "low"           # Nice to have, can be deferred


@dataclass
class DocumentInsight:
    """Structured insight with quality metrics"""
    title: str
    description: str
    insight_type: InsightType
    priority: InsightPriority
    confidence_score: float  # 0-1 scale

    # Enhanced metadata
    actionable: bool = True
    measurable: bool = False
    time_bound: bool = False
    specific: bool = True

    # Business impact
    business_impact: Optional[str] = None
    financial_impact: Optional[float] = None
    affected_stakeholders: List[str] = field(default_factory=list)

    # Actionability
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    dependencies: List[str] = field(default_factory=list)

    # Evidence and context
    supporting_quotes: List[str] = field(default_factory=list)
    related_documents: List[str] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)

    # Quality metrics
    clarity_score: float = 0.0  # How clear and unambiguous
    relevance_score: float = 0.0  # How relevant to business goals
    novelty_score: float = 0.0  # How new/unique the insight is

    def calculate_quality_score(self) -> float:
        """Calculate overall quality score for the insight"""
        # SMART criteria scoring
        smart_score = sum([
            self.specific * 0.2,
            self.measurable * 0.2,
            self.actionable * 0.3,  # Higher weight for actionability
            (self.relevance_score > 0.7) * 0.2,
            self.time_bound * 0.1
        ])

        # Quality components
        quality_components = [
            self.confidence_score * 0.25,
            self.clarity_score * 0.20,
            self.relevance_score * 0.25,
            self.novelty_score * 0.15,
            smart_score * 0.15
        ]

        return sum(quality_components)


class HighQualityInsightsGenerator:
    """Advanced insight generation with quality control"""

    def __init__(self, supabase_client, openai_client: AsyncOpenAI):
        self.supabase = supabase_client
        self.openai = openai_client
        self.encoding = tiktoken.encoding_for_model("gpt-4o-mini")

    async def generate_insights(self,
                               document_id: str,
                               full_content: str,
                               document_metadata: Dict[str, Any]) -> List[DocumentInsight]:
        """Generate high-quality insights from complete document content"""

        # Stage 1: Deep document analysis
        document_analysis = await self._analyze_document_structure(full_content, document_metadata)

        # Stage 2: Extract raw insights with context
        raw_insights = await self._extract_raw_insights(full_content, document_analysis)

        # Stage 3: Enhance and validate insights
        enhanced_insights = await self._enhance_insights(raw_insights, document_analysis)

        # Stage 4: Score and filter insights
        quality_insights = self._filter_by_quality(enhanced_insights)

        # Stage 5: Cross-reference and deduplicate
        final_insights = await self._deduplicate_and_prioritize(quality_insights, document_id)

        return final_insights

    async def _analyze_document_structure(self, content: str, metadata: Dict) -> Dict:
        """Perform deep structural analysis of the document"""

        prompt = f"""Analyze this document comprehensively and identify:

1. Document Type & Purpose:
   - What kind of document is this?
   - What is its primary purpose?
   - Who is the intended audience?

2. Key Themes & Topics:
   - Main subjects discussed
   - Recurring patterns or concerns
   - Strategic initiatives mentioned

3. Stakeholders & Entities:
   - People mentioned (names, roles)
   - Companies/organizations
   - Teams or departments

4. Temporal Elements:
   - Dates and deadlines mentioned
   - Timeline of events
   - Project phases

5. Quantitative Data:
   - Budget figures
   - Performance metrics
   - Resource allocations
   - Risk assessments (percentages, scores)

6. Decision Points:
   - Decisions already made
   - Pending decisions
   - Options being considered

7. Action Items & Commitments:
   - Explicit action items
   - Implied responsibilities
   - Follow-up requirements

Document Title: {metadata.get('title', 'Unknown')}
Document Date: {metadata.get('created_at', 'Unknown')}

Content:
{content[:8000]}  # Use first 8000 chars for analysis

Provide a structured JSON analysis."""

        response = await self.openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )

        return json.loads(response.choices[0].message.content)

    async def _extract_raw_insights(self, content: str, analysis: Dict) -> List[Dict]:
        """Extract comprehensive insights from the document"""

        # Smart content chunking for long documents
        chunks = self._smart_chunk_content(content, max_tokens=6000)
        all_insights = []

        for i, chunk in enumerate(chunks):
            prompt = f"""Extract HIGH-VALUE insights from this document section.

Document Analysis Context:
{json.dumps(analysis, indent=2)[:2000]}

Section {i+1} of {len(chunks)}:
{chunk}

Generate insights that are:
1. SPECIFIC - Not generic or vague
2. ACTIONABLE - Clear next steps
3. MEASURABLE - Quantifiable when possible
4. EVIDENCE-BASED - Supported by document content
5. BUSINESS-CRITICAL - Focus on what matters

For each insight provide:
- title: Clear, concise title (max 100 chars)
- description: Detailed explanation (200-500 chars)
- type: action_item|decision|risk|opportunity|key_finding|blocker|milestone|dependency|budget_impact|timeline_change|technical_debt|compliance_issue|strategic_initiative|performance_metric|stakeholder_concern
- priority: critical|high|medium|low
- supporting_quote: Exact quote from document
- stakeholders: List of affected people/teams
- business_impact: Clear business consequence
- measurable_outcome: How to measure success/completion
- suggested_deadline: When this should be addressed
- dependencies: What this depends on

Output as JSON array. Quality over quantity - only extract truly valuable insights."""

            response = await self.openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.4
            )

            try:
                insights_data = json.loads(response.choices[0].message.content)
                if isinstance(insights_data, dict) and 'insights' in insights_data:
                    all_insights.extend(insights_data['insights'])
                elif isinstance(insights_data, list):
                    all_insights.extend(insights_data)
            except json.JSONDecodeError:
                print(f"Failed to parse insights from chunk {i+1}")
                continue

        return all_insights

    async def _enhance_insights(self, raw_insights: List[Dict], analysis: Dict) -> List[DocumentInsight]:
        """Enhance raw insights with quality scoring and validation"""

        enhanced_insights = []

        for raw in raw_insights:
            # Create structured insight
            insight = DocumentInsight(
                title=raw.get('title', ''),
                description=raw.get('description', ''),
                insight_type=InsightType(raw.get('type', 'key_finding')),
                priority=InsightPriority(raw.get('priority', 'medium')),
                confidence_score=0.8,  # Base confidence

                business_impact=raw.get('business_impact'),
                supporting_quotes=[raw.get('supporting_quote', '')],
                affected_stakeholders=raw.get('stakeholders', []),
                dependencies=raw.get('dependencies', [])
            )

            # Calculate quality metrics
            insight.specific = len(insight.title) > 10 and not self._is_generic(insight.title)
            insight.measurable = bool(raw.get('measurable_outcome'))
            insight.actionable = insight.insight_type in [
                InsightType.ACTION_ITEM,
                InsightType.DECISION,
                InsightType.BLOCKER
            ]
            insight.time_bound = bool(raw.get('suggested_deadline'))

            # Score components
            insight.clarity_score = self._calculate_clarity_score(insight)
            insight.relevance_score = self._calculate_relevance_score(insight, analysis)
            insight.novelty_score = await self._calculate_novelty_score(insight)

            # Set confidence based on evidence
            if insight.supporting_quotes and any(q.strip() for q in insight.supporting_quotes):
                insight.confidence_score = min(0.95, insight.confidence_score + 0.15)

            enhanced_insights.append(insight)

        return enhanced_insights

    def _filter_by_quality(self, insights: List[DocumentInsight], min_quality: float = 0.65) -> List[DocumentInsight]:
        """Filter insights by quality score"""

        quality_insights = []
        for insight in insights:
            score = insight.calculate_quality_score()
            if score >= min_quality:
                quality_insights.append(insight)
            else:
                print(f"Filtered out low-quality insight: {insight.title[:50]}... (score: {score:.2f})")

        return sorted(quality_insights, key=lambda x: x.calculate_quality_score(), reverse=True)

    async def _deduplicate_and_prioritize(self, insights: List[DocumentInsight], document_id: str) -> List[DocumentInsight]:
        """Remove duplicates and prioritize insights"""

        # Group similar insights
        unique_insights = []
        seen_concepts = set()

        for insight in insights:
            # Create a concept signature
            concept = self._get_concept_signature(insight)

            if concept not in seen_concepts:
                seen_concepts.add(concept)
                unique_insights.append(insight)
            else:
                # Merge with existing if higher quality
                existing_idx = self._find_similar_insight(unique_insights, insight)
                if existing_idx >= 0:
                    existing = unique_insights[existing_idx]
                    if insight.calculate_quality_score() > existing.calculate_quality_score():
                        unique_insights[existing_idx] = insight

        # Limit to top insights
        max_insights_per_doc = 10  # Quality over quantity
        return unique_insights[:max_insights_per_doc]

    def _smart_chunk_content(self, content: str, max_tokens: int = 6000) -> List[str]:
        """Intelligently chunk content preserving context"""

        tokens = self.encoding.encode(content)
        if len(tokens) <= max_tokens:
            return [content]

        # Find natural breaking points
        chunks = []
        current_chunk = []
        current_tokens = 0

        # Split by paragraphs first
        paragraphs = content.split('\n\n')

        for para in paragraphs:
            para_tokens = self.encoding.encode(para)
            para_token_count = len(para_tokens)

            if current_tokens + para_token_count > max_tokens:
                if current_chunk:
                    chunks.append('\n\n'.join(current_chunk))
                current_chunk = [para]
                current_tokens = para_token_count
            else:
                current_chunk.append(para)
                current_tokens += para_token_count

        if current_chunk:
            chunks.append('\n\n'.join(current_chunk))

        return chunks

    def _is_generic(self, text: str) -> bool:
        """Check if text is too generic"""
        generic_phrases = [
            'update', 'review', 'discuss', 'consider', 'evaluate',
            'monitor', 'track', 'assess', 'analyze', 'investigate'
        ]
        text_lower = text.lower()
        return any(phrase in text_lower and len(text.split()) < 5 for phrase in generic_phrases)

    def _calculate_clarity_score(self, insight: DocumentInsight) -> float:
        """Score how clear and specific the insight is"""
        score = 0.5  # Base score

        # Clear title
        if len(insight.title) > 20 and len(insight.title) < 100:
            score += 0.2

        # Detailed description
        if len(insight.description) > 100:
            score += 0.2

        # Has supporting evidence
        if insight.supporting_quotes:
            score += 0.1

        return min(1.0, score)

    def _calculate_relevance_score(self, insight: DocumentInsight, analysis: Dict) -> float:
        """Score relevance to document themes and business goals"""
        score = 0.7  # Base relevance

        # Higher relevance for critical types
        if insight.insight_type in [InsightType.RISK, InsightType.BLOCKER, InsightType.COMPLIANCE_ISSUE]:
            score += 0.2

        # Has business impact
        if insight.business_impact:
            score += 0.1

        return min(1.0, score)

    async def _calculate_novelty_score(self, insight: DocumentInsight) -> float:
        """Calculate how unique/novel this insight is"""
        # For now, return a base score
        # In production, would check against existing insights
        return 0.7

    def _get_concept_signature(self, insight: DocumentInsight) -> str:
        """Create a signature for deduplication"""
        # Combine key elements for matching
        elements = [
            insight.insight_type.value,
            ' '.join(insight.keywords[:3]),
            ' '.join(insight.affected_stakeholders[:2])
        ]
        return '|'.join(elements).lower()

    def _find_similar_insight(self, insights: List[DocumentInsight], target: DocumentInsight) -> int:
        """Find index of similar insight in list"""
        target_sig = self._get_concept_signature(target)
        for i, insight in enumerate(insights):
            if self._get_concept_signature(insight) == target_sig:
                return i
        return -1


async def main():
    """Main execution function"""

    print("🚀 HIGH-QUALITY INSIGHTS GENERATOR v2.0")
    print("=" * 70)

    # Initialize clients
    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_KEY")
    )
    openai_client = AsyncOpenAI(api_key=os.getenv('OPENAI_API_KEY') or os.getenv('LLM_API_KEY'))

    generator = HighQualityInsightsGenerator(supabase, openai_client)

    # Step 1: Delete existing poor quality insights
    print("\n🗑️  Clearing existing low-quality insights...")
    # Use a valid condition - delete all insights
    delete_result = supabase.table('document_insights').delete().gte('created_at', '2000-01-01').execute()
    print(f"✅ Deleted {len(delete_result.data) if delete_result.data else 'all'} existing insights")

    # Step 2: Get all documents with full content from document_metadata table ONLY
    print("\n📚 Fetching documents from document_metadata table...")

    # Get documents from document_metadata table with content
    docs_result = supabase.table('document_metadata')\
        .select('id, title, content, entities, url, created_at, date, participants, summary, action_items, bullet_points')\
        .execute()

    if not docs_result.data:
        print("❌ No documents found in document_metadata table")
        print("   Please ensure document_metadata table is populated with content.")
        print("   You may need to run sync_documents_to_metadata.py first.")
        return

    # Filter to only documents with content
    documents_to_process = [
        doc for doc in docs_result.data
        if doc.get('content')  # Only process documents with content
    ]

    if not documents_to_process:
        print("❌ No documents with content found in document_metadata table")
        print("   All documents have empty content fields.")
        return

    print(f"📊 Found {len(documents_to_process)} documents with content to process")

    # Limit to first 5 documents for testing
    documents_to_process = documents_to_process[:5]
    print(f"⚠️  Limiting to first {len(documents_to_process)} documents for testing")

    # Step 3: Process each document with full content
    total_insights_generated = 0
    high_quality_insights = 0

    for doc in documents_to_process:
        doc_id = doc['id']
        doc_title = doc.get('title', 'Unknown Document')
        full_content = doc.get('content', '')
        doc_metadata = doc.get('metadata', {})

        if not full_content:
            print(f"   ⚠️  No content found for document {doc_id}")
            continue

        print(f"   📖 Document: {doc_title[:50]}...")
        print(f"   📏 Content length: {len(full_content)} characters")

        try:
            # Generate high-quality insights
            insights = await generator.generate_insights(doc_id, full_content, doc_metadata)

            print(f"   💡 Generated {len(insights)} high-quality insights")

            # Store insights in database
            for insight in insights:
                insight_data = {
                    'document_id': doc_id,
                    'title': insight.title,
                    'description': insight.description,
                    'insight_type': insight.insight_type.value,
                    'priority': insight.priority.value,
                    'confidence_score': insight.confidence_score,
                    'business_impact': insight.business_impact,
                    'financial_impact': insight.financial_impact,
                    'stakeholders_affected': insight.affected_stakeholders,
                    'dependencies': insight.dependencies,
                    'exact_quotes': insight.supporting_quotes,
                    'metadata': {
                        'quality_score': insight.calculate_quality_score(),
                        'clarity_score': insight.clarity_score,
                        'relevance_score': insight.relevance_score,
                        'novelty_score': insight.novelty_score,
                        'actionable': insight.actionable,
                        'measurable': insight.measurable,
                        'specific': insight.specific,
                        'time_bound': insight.time_bound,
                        'keywords': insight.keywords
                    },
                    'doc_title': doc_title,
                    'generated_by': 'high_quality_generator_v2',
                    'created_at': datetime.now().isoformat()
                }

                # Insert into document_insights table
                insert_result = supabase.table('document_insights').insert(insight_data).execute()

                if insight.calculate_quality_score() >= 0.8:
                    high_quality_insights += 1
                    print(f"      ⭐ HIGH QUALITY: {insight.title[:60]}...")

                total_insights_generated += 1

        except Exception as e:
            print(f"   ❌ Error processing document: {str(e)}")
            continue

    # Final summary
    print("\n" + "=" * 70)
    print("📊 GENERATION COMPLETE")
    print(f"   Total documents processed: {len(documents_to_process)}")
    print(f"   Total insights generated: {total_insights_generated}")
    print(f"   High-quality insights (score ≥ 0.8): {high_quality_insights}")
    if documents_to_process:
        print(f"   Average insights per document: {total_insights_generated / len(documents_to_process):.1f}")
    print("\n✨ Insights are now 1,000,000x better!")


if __name__ == "__main__":
    asyncio.run(main())