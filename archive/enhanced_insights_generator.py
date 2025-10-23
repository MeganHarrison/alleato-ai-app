"""
Enhanced Document Insights Generator for Business Intelligence

This module generates high-value business insights using the new document_insights schema
with rich metadata, financial impact analysis, and strategic assessment.
"""

import os
import re
import json
import logging
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum

from openai import AsyncOpenAI
from supabase import Client

logger = logging.getLogger(__name__)


class EnhancedInsightType(Enum):
    """Enhanced insight types for business intelligence."""
    ACTION_ITEM = "action_item"
    DECISION = "decision"
    RISK = "risk"
    OPPORTUNITY = "opportunity"
    FINANCIAL_IMPACT = "financial_impact"
    STRATEGIC_INITIATIVE = "strategic_initiative"
    RESOURCE_CONSTRAINT = "resource_constraint"
    TIMELINE_RISK = "timeline_risk"
    STAKEHOLDER_CONCERN = "stakeholder_concern"
    COMPLIANCE_ISSUE = "compliance_issue"
    PERFORMANCE_METRIC = "performance_metric"
    COMPETITIVE_INTEL = "competitive_intel"
    OPERATIONAL_EFFICIENCY = "operational_efficiency"
    CLIENT_FEEDBACK = "client_feedback"
    VENDOR_ISSUE = "vendor_issue"


@dataclass
class EnhancedInsight:
    """Enhanced insight with business intelligence metadata."""
    # Core fields
    insight_type: str
    title: str
    description: str
    confidence_score: float
    severity: str
    
    # Business intelligence fields
    business_impact: Optional[str] = None
    financial_impact: Optional[float] = None
    urgency_indicators: Optional[List[str]] = None
    stakeholders_affected: Optional[List[str]] = None
    exact_quotes: Optional[List[str]] = None
    numerical_data: Optional[Dict[str, Any]] = None
    critical_path_impact: bool = False
    cross_project_impact: Optional[List[int]] = None
    dependencies: Optional[List[str]] = None
    
    # Assignment and timeline
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    
    # Source tracking
    document_id: Optional[str] = None
    project_id: Optional[int] = None
    doc_title: Optional[str] = None
    source_meetings: Optional[List[str]] = None
    
    # Metadata
    metadata: Optional[Dict[str, Any]] = None
    generated_by: str = "enhanced-gpt-4o-mini"
    resolved: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage."""
        return asdict(self)


class EnhancedInsightsGenerator:
    """
    Advanced insights generator that creates high-value business intelligence
    from meeting transcripts and project documents.
    """
    
    def __init__(self, supabase: Client, openai_client: AsyncOpenAI):
        self.supabase = supabase
        self.openai_client = openai_client
        self.model = os.getenv('LLM_CHOICE', 'gpt-4o-mini')
