"""
Insights Generation Module for RAG Pipeline

This module integrates insights generation with the document processing pipeline,
automatically extracting actionable intelligence from processed documents.
"""

from .insights_service import (
    InsightType,
    InsightPriority, 
    InsightStatus,
    ProjectInsight,
    MeetingInsightsGenerator
)

from .insights_processor import InsightsProcessor
from .insights_triggers import InsightsTriggerManager

__all__ = [
    'InsightType',
    'InsightPriority',
    'InsightStatus', 
    'ProjectInsight',
    'MeetingInsightsGenerator',
    'InsightsProcessor',
    'InsightsTriggerManager'
]