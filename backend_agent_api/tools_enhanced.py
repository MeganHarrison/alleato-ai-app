"""
Enhanced tools configuration for better RAG performance.

This module provides configuration and enhancements to make the agent
provide more intelligent, contextual responses based on actual data.
"""

# Configuration for better RAG performance
RAG_CONFIG = {
    "semantic_search": {
        "default_match_count": 12,  # Increased from 4 to get more context
        "similarity_threshold": 0.5,  # Lower threshold to get more relevant results
        "include_metadata": True,
        "group_by_document": True,  # Group chunks from same document
    },
    "hybrid_search": {
        "semantic_weight": 0.7,  # Increase semantic weight for conceptual queries
        "keyword_weight": 0.3,
        "match_count": 15,
        "expand_query": True,  # Automatically expand queries with synonyms
    },
    "chunk_processing": {
        "combine_chunks": True,  # Combine adjacent chunks from same document
        "context_window": 2,  # Include 2 chunks before/after matched chunk
        "max_chunk_length": 1500,  # Allow larger context windows
    },
    "response_generation": {
        "require_citations": True,  # Always require source citations
        "min_sources": 3,  # Minimum number of sources to cite
        "synthesize_across_docs": True,  # Synthesize information from multiple documents
        "include_confidence_scores": True,
    },
    "insights_fallback": {
        "enabled": True,  # If insights fail, fall back to document search
        "search_patterns": {
            "risks": ["risk", "concern", "issue", "problem", "challenge", "threat", "worry"],
            "opportunities": ["opportunity", "potential", "growth", "expansion", "improvement"],
            "decisions": ["decided", "decision", "agreed", "approved", "rejected", "chose"],
            "action_items": ["action", "todo", "will", "need to", "assigned", "responsible"],
        }
    }
}

def enhance_search_query(query: str, query_type: str = "general") -> str:
    """
    Enhance search queries based on type and context.

    Args:
        query: Original user query
        query_type: Type of query (risks, opportunities, status, etc.)

    Returns:
        Enhanced query with expanded terms and context
    """
    enhancements = {
        "risks": " OR ".join([
            query,
            "risk concern issue problem challenge threat blocker delay cost overrun",
            "behind schedule over budget permit issue compliance problem"
        ]),
        "opportunities": " OR ".join([
            query,
            "opportunity potential growth expansion improvement optimize streamline",
            "cost savings efficiency gain market advantage"
        ]),
        "status": " OR ".join([
            query,
            "status update progress milestone completed done finished",
            "on track behind schedule ahead delayed"
        ]),
        "financial": " OR ".join([
            query,
            "budget cost expense financial revenue profit margin",
            "over budget under budget cost overrun savings"
        ])
    }

    # Detect query type if not specified
    if query_type == "general":
        query_lower = query.lower()
        for key, patterns in RAG_CONFIG["insights_fallback"]["search_patterns"].items():
            if any(pattern in query_lower for pattern in patterns):
                query_type = key
                break

    return enhancements.get(query_type, query)

def group_chunks_by_document(chunks: list) -> dict:
    """
    Group chunks by their source document for better context.

    Args:
        chunks: List of document chunks

    Returns:
        Dictionary with document IDs as keys and chunks as values
    """
    grouped = {}
    for chunk in chunks:
        doc_id = chunk.get('metadata', {}).get('file_id', 'unknown')
        if doc_id not in grouped:
            grouped[doc_id] = []
        grouped[doc_id].append(chunk)

    # Sort chunks within each document by chunk_index
    for doc_id in grouped:
        grouped[doc_id].sort(key=lambda x: x.get('metadata', {}).get('chunk_index', 0))

    return grouped

def combine_adjacent_chunks(chunks: list, max_length: int = 1500) -> list:
    """
    Combine adjacent chunks from the same document for more context.

    Args:
        chunks: List of chunks from the same document
        max_length: Maximum combined chunk length

    Returns:
        List of combined chunks
    """
    if len(chunks) <= 1:
        return chunks

    combined = []
    current_combined = chunks[0].copy()
    current_length = len(current_combined.get('content', ''))

    for i in range(1, len(chunks)):
        chunk = chunks[i]
        chunk_length = len(chunk.get('content', ''))

        # Check if chunks are adjacent and combined length is acceptable
        prev_index = current_combined.get('metadata', {}).get('chunk_index', -1)
        curr_index = chunk.get('metadata', {}).get('chunk_index', -1)

        if curr_index == prev_index + 1 and current_length + chunk_length <= max_length:
            # Combine chunks
            current_combined['content'] += "\n" + chunk['content']
            current_length += chunk_length
            # Update metadata to reflect combined range
            current_combined['metadata']['chunk_range'] = f"{current_combined['metadata'].get('chunk_index', 0)}-{curr_index}"
        else:
            # Start new combined chunk
            combined.append(current_combined)
            current_combined = chunk.copy()
            current_length = chunk_length

    # Add the last combined chunk
    combined.append(current_combined)

    return combined

def synthesize_across_documents(grouped_chunks: dict, query: str) -> str:
    """
    Synthesize information across multiple documents.

    Args:
        grouped_chunks: Chunks grouped by document
        query: Original query for context

    Returns:
        Synthesized analysis with patterns and insights
    """
    synthesis = []

    # Identify patterns across documents
    all_dates = []
    all_topics = []
    risk_mentions = []
    opportunity_mentions = []

    for doc_id, chunks in grouped_chunks.items():
        doc_content = " ".join([c.get('content', '') for c in chunks])
        doc_metadata = chunks[0].get('metadata', {}) if chunks else {}

        # Extract date if available
        if 'date' in doc_metadata or 'created_at' in doc_metadata:
            all_dates.append(doc_metadata.get('date') or doc_metadata.get('created_at'))

        # Extract risks and opportunities
        doc_lower = doc_content.lower()
        for pattern in RAG_CONFIG["insights_fallback"]["search_patterns"]["risks"]:
            if pattern in doc_lower:
                risk_mentions.append({
                    'document': doc_metadata.get('file_title', doc_id),
                    'pattern': pattern,
                    'count': doc_lower.count(pattern)
                })

        for pattern in RAG_CONFIG["insights_fallback"]["search_patterns"]["opportunities"]:
            if pattern in doc_lower:
                opportunity_mentions.append({
                    'document': doc_metadata.get('file_title', doc_id),
                    'pattern': pattern,
                    'count': doc_lower.count(pattern)
                })

    # Build synthesis
    if all_dates:
        synthesis.append(f"**Time Range**: {min(all_dates)} to {max(all_dates)}")

    if risk_mentions:
        top_risks = sorted(risk_mentions, key=lambda x: x['count'], reverse=True)[:5]
        synthesis.append(f"**Risk Indicators Found**: {len(risk_mentions)} mentions across {len(set(r['document'] for r in risk_mentions))} documents")

    if opportunity_mentions:
        synthesis.append(f"**Opportunity Indicators**: {len(opportunity_mentions)} mentions across {len(set(o['document'] for o in opportunity_mentions))} documents")

    if synthesis:
        return "\n".join(synthesis)

    return ""

def format_intelligent_response(chunks: list, query: str, config: dict = RAG_CONFIG) -> str:
    """
    Format chunks into an intelligent, contextual response.

    Args:
        chunks: Raw chunks from search
        query: Original user query
        config: RAG configuration

    Returns:
        Formatted, intelligent response with proper citations
    """
    if not chunks:
        return "I couldn't find specific information about that in the documents. Try rephrasing your query or being more specific about the timeframe or project."

    # Group chunks by document
    grouped = group_chunks_by_document(chunks)

    # Combine adjacent chunks if enabled
    if config["chunk_processing"]["combine_chunks"]:
        for doc_id in grouped:
            grouped[doc_id] = combine_adjacent_chunks(
                grouped[doc_id],
                config["chunk_processing"]["max_chunk_length"]
            )

    # Build response with proper citations
    response_parts = []

    # Add synthesis if enabled
    if config["response_generation"]["synthesize_across_docs"]:
        synthesis = synthesize_across_documents(grouped, query)
        if synthesis:
            response_parts.append("## Cross-Document Analysis\n" + synthesis)

    # Add individual document insights
    response_parts.append("## Relevant Information from Documents")

    for doc_id, doc_chunks in grouped.items():
        if not doc_chunks:
            continue

        metadata = doc_chunks[0].get('metadata', {})
        doc_title = metadata.get('file_title', 'Unknown Document')
        doc_date = metadata.get('date') or metadata.get('created_at', '')

        # Format document header with proper citation
        doc_header = f"\n### **{doc_title}**"
        if doc_date:
            doc_header += f" - {doc_date}"

        response_parts.append(doc_header)

        # Add relevant chunks
        for chunk in doc_chunks[:3]:  # Limit to top 3 chunks per document
            content = chunk.get('content', '').strip()
            if content:
                # Add chunk with context
                if 'chunk_range' in chunk.get('metadata', {}):
                    response_parts.append(f"*[Sections {chunk['metadata']['chunk_range']}]*")
                elif 'chunk_index' in chunk.get('metadata', {}):
                    response_parts.append(f"*[Section {chunk['metadata']['chunk_index']}]*")

                response_parts.append(content[:500] + ("..." if len(content) > 500 else ""))

    # Add confidence and source count
    if config["response_generation"]["include_confidence_scores"]:
        response_parts.append(f"\n---\n*Based on {len(grouped)} documents with {sum(len(chunks) for chunks in grouped.values())} relevant sections*")

    return "\n\n".join(response_parts)

# Export enhanced configuration
__all__ = [
    'RAG_CONFIG',
    'enhance_search_query',
    'group_chunks_by_document',
    'combine_adjacent_chunks',
    'synthesize_across_documents',
    'format_intelligent_response'
]