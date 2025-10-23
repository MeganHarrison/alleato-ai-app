"""
Enhanced Chunking Strategy for Meeting Transcripts
Optimized for strategic business analysis and RAG performance.
"""

import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class ChunkMetadata:
    """Metadata for document chunks."""
    chunk_index: int
    chunk_type: str  # 'decision', 'action_item', 'discussion', 'general'
    speakers: List[str]
    topics: List[str]
    starts_with_speaker: bool
    estimated_importance: float


class MeetingTranscriptChunker:
    """
    Intelligent chunker for meeting transcripts that preserves business context.
    """
    
    def __init__(
        self, 
        target_chunk_size: int = 1500,  # Optimal for meeting content
        overlap_size: int = 300,        # Prevent context loss
        min_chunk_size: int = 800,      # Minimum viable chunk
        max_chunk_size: int = 2500      # Maximum before splitting
    ):
        self.target_chunk_size = target_chunk_size
        self.overlap_size = overlap_size
        self.min_chunk_size = min_chunk_size
        self.max_chunk_size = max_chunk_size
        
    def chunk_meeting_transcript(self, content: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Chunk meeting transcript preserving business context and semantic boundaries.
        
        Args:
            content: Full meeting transcript text
            metadata: Document metadata
            
        Returns:
            List of chunk dictionaries with content and metadata
        """
        
        # Detect if this is a meeting transcript
        if not self._is_meeting_transcript(content):
            # Fall back to standard chunking for non-meeting content
            return self._standard_chunk(content, metadata)
        
        # Pre-process the transcript
        processed_content = self._preprocess_transcript(content)
        
        # Identify semantic boundaries
        boundaries = self._identify_semantic_boundaries(processed_content)
        
        # Create chunks respecting boundaries
        chunks = self._create_chunks_with_boundaries(processed_content, boundaries)
        
        # Post-process chunks and add metadata
        final_chunks = []
        for i, chunk_content in enumerate(chunks):
            chunk_metadata = self._analyze_chunk(chunk_content, i)
            
            final_chunks.append({
                'content': chunk_content,
                'metadata': {
                    **metadata,
                    'chunk_index': i,
                    'chunk_type': chunk_metadata.chunk_type,
                    'speakers': chunk_metadata.speakers,
                    'topics': chunk_metadata.topics,
                    'estimated_importance': chunk_metadata.estimated_importance,
                    'chunk_size': len(chunk_content),
                    'chunking_strategy': 'semantic_meeting'
                }
            })
        
        return final_chunks
    
    def _is_meeting_transcript(self, content: str) -> bool:
        """Detect if content is a meeting transcript."""
        # Look for speaker patterns
        speaker_patterns = [
            r'\b[A-Z][a-zA-Z\s]+:\s',     # "John Doe: "
            r'\b[A-Z_]+\d*:\s',           # "SPEAKER_1: "
            r'^\*\*[^*]+\*\*:\s',         # "**Speaker**: "
            r'>\s*[A-Z][a-zA-Z\s]+:',     # "> John:"
        ]
        
        speaker_matches = sum(len(re.findall(pattern, content, re.MULTILINE)) for pattern in speaker_patterns)
        total_lines = len([line for line in content.split('\n') if line.strip()])
        
        # Meeting indicators in content
        meeting_keywords = [
            'action item', 'decision', 'next steps', 'follow up',
            'discussed', 'agreed', 'meeting', 'agenda'
        ]
        keyword_matches = sum(content.lower().count(keyword) for keyword in meeting_keywords)
        
        return (total_lines > 0 and (speaker_matches / total_lines) > 0.1) or keyword_matches > 3
    
    def _preprocess_transcript(self, content: str) -> str:
        """Clean and standardize transcript format."""
        # Normalize speaker patterns
        content = re.sub(r'\*\*([^*]+)\*\*:\s*', r'\1: ', content)
        
        # Ensure consistent line breaks after speakers
        content = re.sub(r'([A-Z][a-zA-Z\s]+):\s*', r'\1:\n', content)
        
        # Clean up extra whitespace
        content = re.sub(r'\n\s*\n', '\n\n', content)
        
        return content.strip()
    
    def _identify_semantic_boundaries(self, content: str) -> List[int]:
        """Identify optimal break points that preserve business context."""
        boundaries = [0]  # Start with beginning
        
        lines = content.split('\n')
        current_pos = 0
        
        for i, line in enumerate(lines):
            line_start = current_pos
            current_pos += len(line) + 1  # +1 for newline
            
            # Strong boundaries (definitely break here)
            strong_boundary_patterns = [
                r'^(Action Items?|Next Steps?|Decisions?|Summary):',
                r'^## ',  # Markdown headers
                r'^\d+\.\s+',  # Numbered lists
                r'^(\*\*|__).+(Action|Decision|Risk|Issue)',
            ]
            
            if any(re.match(pattern, line.strip(), re.IGNORECASE) for pattern in strong_boundary_patterns):
                boundaries.append(line_start)
                continue
            
            # Medium boundaries (break if chunk getting large)
            medium_boundary_patterns = [
                r'^[A-Z][a-zA-Z\s]+:\s*$',  # Speaker changes
                r'^[A-Z][A-Z_]+\d*:\s*$',   # Speaker codes
                r'^\s*[-*]\s+',             # Bullet points
            ]
            
            if any(re.match(pattern, line) for pattern in medium_boundary_patterns):
                # Only break if current chunk would be reasonable size
                if len(boundaries) > 0:
                    last_boundary = boundaries[-1]
                    potential_chunk_size = line_start - last_boundary
                    if potential_chunk_size > self.min_chunk_size:
                        boundaries.append(line_start)
        
        boundaries.append(len(content))  # End boundary
        return boundaries
    
    def _create_chunks_with_boundaries(self, content: str, boundaries: List[int]) -> List[str]:
        """Create chunks respecting semantic boundaries and size constraints."""
        chunks = []
        
        i = 0
        while i < len(boundaries) - 1:
            chunk_start = boundaries[i]
            chunk_end = boundaries[i + 1]
            
            # Try to create a chunk of optimal size
            while chunk_end - chunk_start < self.target_chunk_size and i + 2 < len(boundaries):
                i += 1
                chunk_end = boundaries[i + 1]
            
            # If chunk is too large, split it
            if chunk_end - chunk_start > self.max_chunk_size:
                chunk_end = chunk_start + self.target_chunk_size
                # Try to find a good break point within the size limit
                chunk_text = content[chunk_start:chunk_end]
                last_sentence = chunk_text.rfind('. ')
                last_paragraph = chunk_text.rfind('\n\n')
                
                if last_paragraph > chunk_start + self.min_chunk_size:
                    chunk_end = chunk_start + last_paragraph
                elif last_sentence > chunk_start + self.min_chunk_size:
                    chunk_end = chunk_start + last_sentence + 1
            
            chunk_content = content[chunk_start:chunk_end].strip()
            
            if len(chunk_content) > 50:  # Minimum viable content
                # Add overlap with previous chunk if not the first
                if chunks and self.overlap_size > 0:
                    overlap_start = max(0, chunk_start - self.overlap_size)
                    overlap_content = content[overlap_start:chunk_start].strip()
                    if overlap_content:
                        chunk_content = overlap_content + "\n\n" + chunk_content
                
                chunks.append(chunk_content)
            
            i += 1
        
        return chunks
    
    def _analyze_chunk(self, content: str, chunk_index: int) -> ChunkMetadata:
        """Analyze chunk to determine type, speakers, and importance."""
        
        # Extract speakers
        speakers = self._extract_speakers(content)
        
        # Determine chunk type
        chunk_type = self._classify_chunk_type(content)
        
        # Extract topics/keywords
        topics = self._extract_topics(content)
        
        # Estimate importance
        importance = self._estimate_importance(content, chunk_type)
        
        return ChunkMetadata(
            chunk_index=chunk_index,
            chunk_type=chunk_type,
            speakers=speakers,
            topics=topics,
            starts_with_speaker=bool(re.match(r'^[A-Z][a-zA-Z\s]+:\s', content.strip())),
            estimated_importance=importance
        )
    
    def _extract_speakers(self, content: str) -> List[str]:
        """Extract speaker names from chunk."""
        speaker_patterns = [
            r'^([A-Z][a-zA-Z\s]+):\s',
            r'^\*\*([^*]+)\*\*:',
            r'^([A-Z_]+\d*):\s'
        ]
        
        speakers = set()
        for pattern in speaker_patterns:
            matches = re.findall(pattern, content, re.MULTILINE)
            speakers.update(match.strip() for match in matches)
        
        return list(speakers)[:5]  # Limit to prevent noise
    
    def _classify_chunk_type(self, content: str) -> str:
        """Classify the type of content in the chunk."""
        content_lower = content.lower()
        
        # Decision indicators
        decision_keywords = ['decided', 'agreed', 'conclusion', 'resolution', 'final decision']
        if any(keyword in content_lower for keyword in decision_keywords):
            return 'decision'
        
        # Action item indicators  
        action_keywords = ['action item', 'next step', 'follow up', 'assigned to', 'due date', 'task']
        if any(keyword in content_lower for keyword in action_keywords):
            return 'action_item'
        
        # Risk/issue indicators
        risk_keywords = ['risk', 'concern', 'issue', 'problem', 'challenge', 'blocker']
        if any(keyword in content_lower for keyword in risk_keywords):
            return 'risk_issue'
        
        # Technical discussion
        technical_keywords = ['implementation', 'architecture', 'technical', 'system', 'integration']
        if any(keyword in content_lower for keyword in technical_keywords):
            return 'technical_discussion'
        
        return 'general_discussion'
    
    def _extract_topics(self, content: str) -> List[str]:
        """Extract key topics from chunk content."""
        # Simple keyword extraction - could be enhanced with NLP
        business_terms = [
            'budget', 'timeline', 'deadline', 'project', 'client', 'stakeholder',
            'milestone', 'deliverable', 'resource', 'team', 'meeting', 'review',
            'approval', 'requirement', 'scope', 'contract', 'vendor', 'supplier'
        ]
        
        found_topics = []
        content_lower = content.lower()
        
        for term in business_terms:
            if term in content_lower:
                found_topics.append(term)
        
        # Extract potential project names (capitalized terms)
        project_names = re.findall(r'\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b', content)
        found_topics.extend(project_names[:3])  # Limit to prevent noise
        
        return found_topics[:8]  # Reasonable limit
    
    def _estimate_importance(self, content: str, chunk_type: str) -> float:
        """Estimate the business importance of the chunk."""
        base_score = {
            'decision': 0.9,
            'action_item': 0.8,
            'risk_issue': 0.85,
            'technical_discussion': 0.6,
            'general_discussion': 0.5
        }.get(chunk_type, 0.5)
        
        # Boost for high-priority keywords
        high_priority_keywords = [
            'critical', 'urgent', 'deadline', 'budget', 'client', 'risk',
            'blocker', 'escalation', 'approval', 'contract', 'legal'
        ]
        
        content_lower = content.lower()
        priority_boost = sum(0.1 for keyword in high_priority_keywords if keyword in content_lower)
        
        # Boost for longer, more detailed content
        length_boost = min(0.2, len(content) / 2000)  # Up to 0.2 for very detailed chunks
        
        return min(1.0, base_score + priority_boost + length_boost)
    
    def _standard_chunk(self, content: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Fallback to standard chunking for non-meeting content."""
        chunks = []
        content_length = len(content)
        
        start = 0
        chunk_index = 0
        
        while start < content_length:
            end = min(start + self.target_chunk_size, content_length)
            
            # Try to break at sentence boundary
            if end < content_length:
                last_period = content.rfind('. ', start, end)
                if last_period > start + self.min_chunk_size:
                    end = last_period + 1
            
            chunk_content = content[start:end].strip()
            
            if chunk_content:
                chunks.append({
                    'content': chunk_content,
                    'metadata': {
                        **metadata,
                        'chunk_index': chunk_index,
                        'chunk_type': 'standard',
                        'chunk_size': len(chunk_content),
                        'chunking_strategy': 'standard'
                    }
                })
                chunk_index += 1
            
            # Move start forward with overlap
            start = end - self.overlap_size if end < content_length else end
        
        return chunks


# Usage example
def enhanced_chunk_document(content: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Enhanced chunking function for the RAG pipeline.
    
    Args:
        content: Document content
        metadata: Document metadata
        
    Returns:
        List of chunks with enhanced metadata
    """
    chunker = MeetingTranscriptChunker(
        target_chunk_size=1500,    # Optimal for business content
        overlap_size=300,          # Prevent context loss
        min_chunk_size=800,        # Minimum viable
        max_chunk_size=2500        # Maximum before forcing split
    )
    
    return chunker.chunk_meeting_transcript(content, metadata)
