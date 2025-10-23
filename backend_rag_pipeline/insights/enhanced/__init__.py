"""
Enhanced Insights Integration

This module integrates the enhanced business insights engine with the existing
RAG pipeline and provides updated API endpoints that replace the basic insights system.
"""

from .business_insights_engine import (
    BusinessInsightsEngine,
    EnhancedBusinessInsight,
    BusinessInsightType,
    BusinessSeverity
)
from .enhanced_insights_processor import EnhancedInsightsProcessor

# Only import API router when explicitly needed to avoid env var requirements
def get_enhanced_insights_router():
    """Lazy import of API router to avoid requiring env vars at module level."""
    from .enhanced_insights_api import router as enhanced_insights_router
    return enhanced_insights_router

__all__ = [
    'BusinessInsightsEngine',
    'EnhancedBusinessInsight', 
    'BusinessInsightType',
    'BusinessSeverity',
    'EnhancedInsightsProcessor',
    'get_enhanced_insights_router'
]
