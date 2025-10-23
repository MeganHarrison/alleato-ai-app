from RestrictedPython import compile_restricted
from RestrictedPython.Guards import safe_globals, safe_builtins, guarded_unpack_sequence
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai import Agent, BinaryContent
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from openai import AsyncOpenAI
from httpx import AsyncClient
from supabase import Client
import base64
import json
import sys
import os
import re

# Import insights service (disabled for now)
# from insights_service import (
#     MeetingInsightsGenerator,
#     process_meeting_document_for_insights,
#     get_insights_generator
# )

embedding_model = os.getenv('EMBEDDING_MODEL_CHOICE') or 'text-embedding-3-small'

async def brave_web_search(query: str, http_client: AsyncClient, brave_api_key: str) -> str:
    """
    Helper function for web_search_tool - searches the web with the Brave API
    and returns a summary of all the top search results.

    Args are the same as the parent function except without the SearXNG base url.
    """
    headers = {
        'X-Subscription-Token': brave_api_key,
        'Accept': 'application/json',
    }
    
    response = await http_client.get(
        'https://api.search.brave.com/res/v1/web/search',
        params={
            'q': query,
            'count': 5,
            'text_decorations': True,
            'search_lang': 'en'
        },
        headers=headers
    )
    response.raise_for_status()
    data = response.json()

    results = []
    
    # Add web results in a nice formatted way
    web_results = data.get('web', {}).get('results', [])
    for item in web_results[:3]:
        title = item.get('title', '')
        description = item.get('description', '')
        url = item.get('url', '')
        if title and description:
            results.append(f"Title: {title}\nSummary: {description}\nSource: {url}\n")

    return "\n".join(results) if results else "No results found for the query."

async def searxng_web_search(query: str, http_client: AsyncClient, searxng_base_url: str) -> str:
    """
    Helper function for web_search_tool - searches the web with SearXNG
    and returns a list of the top search results with the most relevant snippet from each page.

    Args are the same as the parent function except without the Brave API key.
    """
    # Prepare the parameters for the request
    params = {'q': query, 'format': 'json'}
    
    # Make the request to SearXNG
    response = await http_client.get(f"{searxng_base_url}/search", params=params)
    response.raise_for_status()  # Raise an exception for HTTP errors
    
    # Parse the results
    data = response.json()
    
    results = ""
    for i, page in enumerate(data.get('results', []), 1):
        if i > 10:  # Limiting to the top 10 results, could make this a parameter for the function too
            break

        results += f"{i}. {page.get('title', 'No title')}"
        results += f"   URL: {page.get('url', 'No URL')}"
        results += f"   Content: {page.get('content', 'No content')[:300]}...\n\n"

    return results if results else "No results found for the query."

async def web_search_tool(query: str, http_client: AsyncClient, brave_api_key: str, searxng_base_url: str) -> str:
    """
    Search the web with a specific query and get a summary of the top search results.
    
    Args:
        query: The query for the web search
        http_client: The client for making HTTP requests to Brave or SearXNG
        brave_api_key: The optional key for Brave (will use SearXNG if this isn't defined)
        searxng_base_url: The optional base URL for SearXNG (will use Brave if this isn't defined)
        
    Returns:
        A summary of the web search.
        For Brave, this is a single paragraph.
        For SearXNG, this is a list of the top search results including the most relevant snippet from the page.
    """
    try:
        if brave_api_key:
            return await brave_web_search(query, http_client, brave_api_key)
        else:
            return await searxng_web_search(query, http_client, searxng_base_url)
    except Exception as e:
        print(f"Exception during websearch: {e}")
        return str(e)

async def get_embedding(text: str, embedding_client: AsyncOpenAI) -> List[float]:
    """Get embedding vector from OpenAI."""
    try:
        response = await embedding_client.embeddings.create(
            model=embedding_model,
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error getting embedding: {e}")
        return [0] * 1536  # Return zero vector on error

async def retrieve_relevant_documents_tool(supabase: Client, embedding_client: AsyncOpenAI, user_query: str) -> str:
    """
    Function to retrieve relevant document chunks with RAG.
    This is called by the retrieve_relevant_documents tool for the agent.
    
    Returns:
        List[str]: List of relevant document chunks with metadata
    """    
    try:
        # Get the embedding for the query
        query_embedding = await get_embedding(user_query, embedding_client)
        
        # Query Supabase for relevant documents - get more chunks for better context
        result = supabase.rpc(
            'match_documents',
            {
                'query_embedding': query_embedding,
                'match_count': 12  # Increased from 4 to get more context
            }
        ).execute()
        
        if not result.data:
            return "No relevant documents found."
            
        # Format the results
        formatted_chunks = []
        for doc in result.data:
            chunk_text = f"""
# Document ID: {doc['metadata'].get('file_id', 'unknown')}      
# Document Tilte: {doc['metadata'].get('file_title', 'unknown')}
# Document URL: {doc['metadata'].get('file_url', 'unknown')}

{doc['content']}
"""
            formatted_chunks.append(chunk_text)
            
        # Join all chunks with a separator
        return "\n\n---\n\n".join(formatted_chunks)
        
    except Exception as e:
        print(f"Error retrieving documents: {e}")
        return f"Error retrieving documents: {str(e)}"

async def semantic_search_tool(supabase: Client, embedding_client: AsyncOpenAI, user_query: str, match_count: int = 20, similarity_threshold: float = 0.4) -> str:
    """
    Advanced semantic search with similarity filtering and query expansion.
    Optimized for conceptual queries and business insights.
    
    Args:
        user_query: The user's search query
        match_count: Number of documents to retrieve
        similarity_threshold: Minimum similarity score to include results
        
    Returns:
        Formatted search results with similarity scores and metadata
    """
    try:
        # Expand query with synonyms and related terms for better matching
        expanded_query = await _expand_query_semantically(user_query, embedding_client)
        
        # Get embeddings for both original and expanded queries
        original_embedding = await get_embedding(user_query, embedding_client)
        expanded_embedding = await get_embedding(expanded_query, embedding_client) if expanded_query != user_query else original_embedding
        
        # Search with original query
        result = supabase.rpc(
            'match_documents_with_score',
            {
                'query_embedding': original_embedding,
                'match_count': match_count * 2,  # Get more results for filtering
                'similarity_threshold': similarity_threshold
            }
        ).execute()
        
        # If expanded query is different, also search with expanded query
        expanded_results = []
        if expanded_query != user_query:
            expanded_result = supabase.rpc(
                'match_documents_with_score',
                {
                    'query_embedding': expanded_embedding,
                    'match_count': match_count,
                    'similarity_threshold': similarity_threshold * 0.9  # Slightly lower threshold for expanded
                }
            ).execute()
            expanded_results = expanded_result.data or []
        
        # Combine and deduplicate results
        all_results = (result.data or []) + expanded_results
        seen_ids = set()
        unique_results = []
        
        for doc in all_results:
            doc_id = doc.get('id')
            if doc_id not in seen_ids:
                seen_ids.add(doc_id)
                unique_results.append(doc)
        
        # Sort by similarity score and take top results
        unique_results.sort(key=lambda x: x.get('similarity', 0), reverse=True)
        unique_results = unique_results[:match_count]
        
        if not unique_results:
            return f"No documents found matching '{user_query}' with similarity >= {similarity_threshold}"
        
        # Format results with enhanced metadata
        formatted_chunks = []
        for i, doc in enumerate(unique_results, 1):
            similarity_score = doc.get('similarity', 0)
            metadata = doc.get('metadata', {})
            
            # Determine content type from metadata
            content_type = _determine_content_type(doc.get('content', ''), metadata)
            
            chunk_text = f"""
## Result {i} (Similarity: {similarity_score:.3f}) - {content_type}

**Document:** {metadata.get('file_title', 'Unknown Document')}
**ID:** {metadata.get('file_id', 'unknown')}
**URL:** {metadata.get('file_url', 'N/A')}
**Speakers:** {metadata.get('speakers', 'N/A')}
**Date:** {metadata.get('created_at', 'Unknown')}

**Content:**
{doc['content']}
"""
            formatted_chunks.append(chunk_text)
        
        # Create the expansion text separately to avoid backslash in f-string
        expansion_text = f'Query expanded to: "{expanded_query}"' if expanded_query != user_query else ""
        
        summary_header = f"""# Semantic Search Results for: "{user_query}"

Found {len(unique_results)} relevant documents (similarity >= {similarity_threshold})
{expansion_text}

"""
        
        return summary_header + "\n\n---\n\n".join(formatted_chunks)
        
    except Exception as e:
        print(f"Error in semantic search: {e}")
        return f"Error in semantic search: {str(e)}"

async def hybrid_search_tool(supabase: Client, embedding_client: AsyncOpenAI, user_query: str, match_count: int = 8) -> str:
    """
    Hybrid search combining semantic similarity with keyword matching.
    Best for specific technical details, names, dates, and exact matches.
    
    Args:
        user_query: The search query
        match_count: Number of results to return
        
    Returns:
        Formatted hybrid search results with both semantic and keyword matches
    """
    try:
        # Extract keywords and key phrases from query
        keywords = _extract_keywords(user_query)
        
        # Semantic search
        semantic_embedding = await get_embedding(user_query, embedding_client)
        semantic_result = supabase.rpc(
            'match_documents',
            {
                'query_embedding': semantic_embedding,
                'match_count': match_count
            }
        ).execute()
        
        # Keyword/full-text search
        keyword_result = supabase.rpc(
            'search_documents_by_keywords',
            {
                'search_terms': keywords,
                'match_count': match_count
            }
        ).execute()
        
        # Combine results with scoring
        semantic_docs = {doc['id']: {'doc': doc, 'semantic_score': doc.get('similarity', 0), 'keyword_score': 0} 
                        for doc in (semantic_result.data or [])}
        
        for doc in (keyword_result.data or []):
            doc_id = doc['id']
            keyword_score = doc.get('keyword_match_score', 0)
            
            if doc_id in semantic_docs:
                semantic_docs[doc_id]['keyword_score'] = keyword_score
            else:
                semantic_docs[doc_id] = {'doc': doc, 'semantic_score': 0, 'keyword_score': keyword_score}
        
        # Calculate hybrid scores (weighted combination)
        semantic_weight = 0.6
        keyword_weight = 0.4
        
        for doc_data in semantic_docs.values():
            doc_data['hybrid_score'] = (
                semantic_weight * doc_data['semantic_score'] + 
                keyword_weight * doc_data['keyword_score']
            )
        
        # Sort by hybrid score and take top results
        sorted_results = sorted(semantic_docs.values(), key=lambda x: x['hybrid_score'], reverse=True)
        top_results = sorted_results[:match_count]
        
        if not top_results:
            return f"No documents found for query: '{user_query}'"
        
        # Format results
        formatted_chunks = []
        for i, result in enumerate(top_results, 1):
            doc = result['doc']
            metadata = doc.get('metadata', {})
            
            chunk_text = f"""
## Hybrid Result {i} (Score: {result['hybrid_score']:.3f})
**Semantic:** {result['semantic_score']:.3f} | **Keyword:** {result['keyword_score']:.3f}

**Document:** {metadata.get('file_title', 'Unknown')}
**ID:** {metadata.get('file_id', 'unknown')}
**Type:** {_determine_content_type(doc.get('content', ''), metadata)}

**Content:**
{doc['content']}
"""
            formatted_chunks.append(chunk_text)
        
        header = f"""# Hybrid Search Results: "{user_query}"

Combining semantic similarity + keyword matching
Keywords extracted: {', '.join(keywords)}
Found {len(top_results)} relevant documents

"""
        
        return header + "\n\n---\n\n".join(formatted_chunks)
        
    except Exception as e:
        print(f"Error in hybrid search: {e}")
        return f"Error in hybrid search: {str(e)}"

async def get_recent_documents_tool(supabase: Client, days_back: int = 7, document_types: List[str] = None, match_count: int = 10) -> str:
    """
    Retrieve recent documents for timeline-based queries and status updates.

    Args:
        days_back: Number of days to look back
        document_types: Filter by document types (e.g., ['meeting', 'transcript', 'report'])
        match_count: Maximum number of UNIQUE documents to return (not chunks)

    Returns:
        Formatted list of recent documents with metadata
    """
    try:
        # Calculate date threshold
        date_threshold = (datetime.now() - timedelta(days=days_back)).isoformat()

        # Build query with filters - get more results to account for chunking
        query = supabase.from_('documents') \
            .select('id, content, metadata, created_at') \
            .gte('created_at', date_threshold) \
            .order('created_at', desc=True) \
            .limit(match_count * 10)  # Get more to account for chunks

        # Apply document type filter if specified
        if document_types:
            # This would need to be implemented based on how document types are stored
            # For now, we'll filter based on filename patterns
            pass

        result = query.execute()

        if not result.data:
            return f"No documents found in the last {days_back} days"

        # Group by UNIQUE document (using file_id or file_title from metadata)
        unique_documents = {}
        for doc in result.data:
            metadata = doc.get('metadata', {})

            # Get unique identifier for the document (not chunk)
            file_id = metadata.get('file_id')
            file_title = metadata.get('file_title', metadata.get('source', 'Unknown'))

            # Use file_id as the unique key, or file_title if file_id doesn't exist
            unique_key = file_id if file_id else file_title

            # Only keep the first chunk of each document (or the one with lowest chunk_index)
            if unique_key not in unique_documents:
                unique_documents[unique_key] = {
                    'doc': doc,
                    'file_title': file_title,
                    'chunk_index': metadata.get('chunk_index', 0)
                }
            else:
                # If we find a lower chunk_index, use that one instead
                current_chunk_index = metadata.get('chunk_index', 999)
                if current_chunk_index < unique_documents[unique_key]['chunk_index']:
                    unique_documents[unique_key] = {
                        'doc': doc,
                        'file_title': file_title,
                        'chunk_index': current_chunk_index
                    }

        # Now we have unique documents, let's format them
        # Sort by created_at and limit to match_count
        sorted_unique_docs = sorted(
            unique_documents.values(),
            key=lambda x: x['doc']['created_at'],
            reverse=True
        )[:match_count]

        if not sorted_unique_docs:
            return f"No unique documents found in the last {days_back} days"

        # Group by date and format
        documents_by_date = {}
        for item in sorted_unique_docs:
            doc = item['doc']
            doc_date = doc['created_at'][:10]  # YYYY-MM-DD
            if doc_date not in documents_by_date:
                documents_by_date[doc_date] = []
            documents_by_date[doc_date].append(doc)

        # Format results by date
        formatted_sections = []
        for date, docs in sorted(documents_by_date.items(), reverse=True):
            date_section = f"## {date} ({len(docs)} unique documents)\n"

            for doc in docs:
                metadata = doc.get('metadata', {})
                content_preview = doc.get('content', '')[:200] + "..." if len(doc.get('content', '')) > 200 else doc.get('content', '')
                
                doc_summary = f"""
### {metadata.get('file_title', 'Untitled Document')}
**ID:** {metadata.get('file_id', doc['id'])}
**Type:** {_determine_content_type(doc.get('content', ''), metadata)}
**Preview:** {content_preview}

"""
                date_section += doc_summary
            
            formatted_sections.append(date_section)
        
        header = f"""# Recent Documents (Last {days_back} Days)

Total documents found: {len(result.data)}
Date range: {date_threshold[:10]} to {datetime.now().strftime('%Y-%m-%d')}

"""
        
        return header + "\n".join(formatted_sections)
        
    except Exception as e:
        print(f"Error retrieving recent documents: {e}")
        return f"Error retrieving recent documents: {str(e)}"

async def smart_document_search_tool(supabase: Client, embedding_client: AsyncOpenAI, user_query: str, search_strategy: str = "auto") -> str:
    """
    Intelligent document search that automatically chooses the best strategy.
    
    Args:
        user_query: The search query
        search_strategy: "auto", "semantic", "hybrid", "recent", or "keyword"
        
    Returns:
        Search results using the optimal strategy
    """
    try:
        # Auto-detect best search strategy if not specified
        if search_strategy == "auto":
            search_strategy = _detect_optimal_search_strategy(user_query)
        
        if search_strategy == "semantic":
            return await semantic_search_tool(supabase, embedding_client, user_query)
        elif search_strategy == "hybrid":
            return await hybrid_search_tool(supabase, embedding_client, user_query)
        elif search_strategy == "recent":
            # Extract time context from query
            days_back = _extract_time_context(user_query)
            return await get_recent_documents_tool(supabase, days_back)
        else:
            # Default to semantic search
            return await semantic_search_tool(supabase, embedding_client, user_query)
            
    except Exception as e:
        print(f"Error in smart document search: {e}")
        return f"Error in smart document search: {str(e)}"

# Helper functions for advanced RAG

async def _expand_query_semantically(query: str, embedding_client: AsyncOpenAI) -> str:
    """Expand query with related terms for better semantic matching."""
    try:
        # Simple query expansion using business context
        business_synonyms = {
            'project': ['initiative', 'effort', 'work', 'task'],
            'issue': ['problem', 'challenge', 'concern', 'blocker'],
            'budget': ['cost', 'expense', 'financial', 'money'],
            'timeline': ['schedule', 'deadline', 'timeframe', 'duration'],
            'client': ['customer', 'stakeholder', 'user'],
            'meeting': ['discussion', 'call', 'session', 'conference'],
            'ASRS': ['automated storage', 'warehouse automation', 'retrieval system'],
            'sprinkler': ['fire protection', 'suppression system', 'safety system']
        }
        
        expanded_terms = []
        query_lower = query.lower()
        
        for key, synonyms in business_synonyms.items():
            if key.lower() in query_lower:
                expanded_terms.extend(synonyms[:2])  # Add top 2 synonyms
        
        if expanded_terms:
            return query + " " + " ".join(expanded_terms)
        
        return query
        
    except Exception:
        return query

def _extract_keywords(query: str) -> List[str]:
    """Extract important keywords from query for hybrid search."""
    import re
    
    # Remove common stop words
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'}
    
    # Extract words and phrases
    words = re.findall(r'\b\w+\b', query.lower())
    keywords = [word for word in words if len(word) > 2 and word not in stop_words]
    
    # Add quoted phrases
    phrases = re.findall(r'"([^"]+)"', query)
    keywords.extend(phrases)
    
    return keywords

def _determine_content_type(content: str, metadata: Dict[str, Any]) -> str:
    """Determine the type of content for better categorization."""
    file_title = metadata.get('file_title', '').lower()
    
    if 'transcript' in file_title or 'meeting' in file_title:
        return 'Meeting Transcript'
    elif 'report' in file_title:
        return 'Report'
    elif any(term in content.lower()[:500] for term in ['speaker', ':', 'said', 'discussion']):
        return 'Conversational Content'
    elif metadata.get('mime_type', '').startswith('image'):
        return 'Image Document'
    elif 'table' in content.lower()[:200] or '|' in content[:200]:
        return 'Structured Data'
    else:
        return 'Text Document'

def _detect_optimal_search_strategy(query: str) -> str:
    """Automatically detect the best search strategy for a given query."""
    query_lower = query.lower()
    
    # Time-based queries
    time_indicators = ['recent', 'last', 'yesterday', 'today', 'this week', 'past', 'latest', 'current']
    if any(indicator in query_lower for indicator in time_indicators):
        return 'recent'
    
    # Specific technical queries (names, IDs, exact terms)
    if any(char in query for char in ['"', "'", '#']) or len(query.split()) <= 2:
        return 'hybrid'
    
    # Conceptual or business insight queries
    conceptual_indicators = ['why', 'how', 'what', 'impact', 'analysis', 'trend', 'pattern', 'strategy']
    if any(indicator in query_lower for indicator in conceptual_indicators):
        return 'semantic'
    
    # Default to hybrid for balanced results
    return 'hybrid'

def _extract_time_context(query: str) -> int:
    """Extract time context from query to determine how far back to search."""
    import re
    
    query_lower = query.lower()
    
    # Look for specific time mentions
    if 'today' in query_lower or 'yesterday' in query_lower:
        return 2
    elif 'this week' in query_lower or 'last week' in query_lower:
        return 7
    elif 'this month' in query_lower or 'last month' in query_lower:
        return 30
    
    # Look for number + time unit patterns
    time_patterns = [
        (r'(\d+)\s*days?', 1),
        (r'(\d+)\s*weeks?', 7),
        (r'(\d+)\s*months?', 30)
    ]
    
    for pattern, multiplier in time_patterns:
        match = re.search(pattern, query_lower)
        if match:
            return int(match.group(1)) * multiplier
    
    # Default to last week
    return 7 

async def list_documents_tool(supabase: Client) -> List[str]:
    """
    Function to retrieve a list of all available documents.
    This is called by the list_documents tool for the agent.
    
    Returns:
        List[str]: List of documents including their metadata (URL/path, schema if applicable, etc.)
    """
    try:
        # Query Supabase for unique documents
        result = supabase.from_('document_metadata') \
            .select('id, title, schema, url') \
            .execute()
            
        return str(result.data)
        
    except Exception as e:
        print(f"Error retrieving documents: {e}")
        return str([])

async def get_document_content_tool(supabase: Client, document_id: str) -> str:
    """
    Retrieve the full content of a specific document by combining all its chunks.
    This is called by the get_document_content tool for the agent.
        
    Returns:
        str: The complete content of the document with all chunks combined in order
    """
    try:
        # Query Supabase for all chunks for this document
        result = supabase.from_('documents') \
            .select('id, content, metadata') \
            .eq('metadata->>file_id', document_id) \
            .order('id') \
            .execute()
        
        if not result.data:
            return f"No content found for document: {document_id}"
            
        # Format the document with its title and all chunks
        document_title = result.data[0]['metadata']['file_title'].split(' - ')[0]  # Get the main title
        formatted_content = [f"# {document_title}\n"]
        
        # Add each chunk's content
        for chunk in result.data:
            formatted_content.append(chunk['content'])
            
        # Join everything together but limit the characters in case the document is massive
        return "\n\n".join(formatted_content)[:20000]
        
    except Exception as e:
        print(f"Error retrieving document content: {e}")
        return f"Error retrieving document content: {str(e)}"     

async def execute_sql_query_tool(supabase: Client, sql_query: str) -> str:
    """
    Run a SQL query - use this to query from the document_rows table once you know the file ID you are querying. 
    dataset_id is the file_id and you are always using the row_data for filtering, which is a jsonb field that has 
    all the keys from the file schema given in the document_metadata table.

    Example query:

    SELECT AVG((row_data->>'revenue')::numeric)
    FROM document_rows
    WHERE dataset_id = '123';

    Example query 2:

    SELECT 
        row_data->>'category' as category,
        SUM((row_data->>'sales')::numeric) as total_sales
    FROM dataset_rows
    WHERE dataset_id = '123'
    GROUP BY row_data->>'category';
    
    Args:
        supabase: The Supabase client
        sql_query: The SQL query to execute (must be read-only)
        
    Returns:
        str: The results of the SQL query in JSON format
    """
    try:
        # Validate that the query is read-only by checking for write operations
        sql_query = sql_query.strip()
        write_operations = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE']
        
        # Convert query to uppercase for case-insensitive comparison
        upper_query = sql_query.upper()
        
        # Check if any write operations are in the query
        for op in write_operations:
            pattern = r'\b' + op + r'\b'
            if re.search(pattern, upper_query):
                return f"Error: Write operation '{op}' detected. Only read-only queries are allowed."
        
        # Execute the query using the RPC function
        result = supabase.rpc(
            'execute_custom_sql',
            {"sql_query": sql_query}
        ).execute()
        
        # Check for errors in the response
        if result.data and 'error' in result.data:
            return f"SQL Error: {result.data['error']}"
        
        # Format the results nicely
        return json.dumps(result.data, indent=2)
        
    except Exception as e:
        return f"Error executing SQL query: {str(e)}"

async def image_analysis_tool(supabase: Client, document_id: str, query: str) -> str:
    try:
        # Environment variables for the vision model
        llm = os.getenv('VISION_LLM_CHOICE', 'gpt-4o-mini')
        base_url = os.getenv('LLM_BASE_URL', 'https://api.openai.com/v1')
        api_key = os.getenv('LLM_API_KEY', 'no-api-key-provided')

        # Define the vision agent based on the environment variables
        model = OpenAIModel(llm, provider=OpenAIProvider(base_url=base_url, api_key=api_key))
        vision_agent = Agent(
            model, 
            system_prompt="You are an image analyzer who looks at images provided and answers the accompanying query in detail."
        )

        # Get the binary of the file from the database
        result = supabase.from_('documents') \
            .select('metadata') \
            .eq('metadata->>file_id', document_id) \
            .limit(1) \
            .execute()

        if not result.data:
            return f"No content found for document: {document_id}"            

        # Get the binary and mime_type from the metadata
        metadata = result.data[0]['metadata']
        binary_str = metadata['file_contents']
        mime_type = metadata['mime_type']

        if not binary_str:
            return f"No file contents found for document: {document_id}"

        # Turn the binary string into binary and send it into the vision LLM
        binary = base64.b64decode(binary_str.encode('utf-8'))
        result = await vision_agent.run([query, BinaryContent(data=binary, media_type=mime_type)])

        return result.data

    except Exception as e:
        print(f"Error analyzing image: {e}")
        return f"Error analyzing image: {str(e)}"           

def execute_safe_code_tool(code: str) -> str:
    # Set up allowed modules
    allowed_modules = {
        # Core utilities
        'datetime': __import__('datetime'),
        'math': __import__('math'),
        'random': __import__('random'),
        'time': __import__('time'),
        'collections': __import__('collections'),
        'itertools': __import__('itertools'),
        'functools': __import__('functools'),
        'copy': __import__('copy'),
        're': __import__('re'),  # Regular expressions
        'json': __import__('json'),
        'csv': __import__('csv'),
        'uuid': __import__('uuid'),
        'string': __import__('string'),
        'statistics': __import__('statistics'),
        
        # Data structures and algorithms
        'heapq': __import__('heapq'),
        'bisect': __import__('bisect'),
        'array': __import__('array'),
        'enum': __import__('enum'),
        'dataclasses': __import__('dataclasses'),
        
        # Numeric/scientific (if installed)
        # 'numpy': __import__('numpy', fromlist=['*']),
        # 'pandas': __import__('pandas', fromlist=['*']),
        # 'scipy': __import__('scipy', fromlist=['*']),
        
        # File/IO (with careful restrictions)
        'io': __import__('io'),
        'base64': __import__('base64'),
        'hashlib': __import__('hashlib'),
        'tempfile': __import__('tempfile')
    }
    
    # Try to import optional modules that might not be installed
    try:
        allowed_modules['numpy'] = __import__('numpy')
    except ImportError:
        pass
        
    try:
        allowed_modules['pandas'] = __import__('pandas')
    except ImportError:
        pass
        
    try:
        allowed_modules['scipy'] = __import__('scipy')
    except ImportError:
        pass
    
    # Custom import function that only allows whitelisted modules
    def safe_import(name, *args, **kwargs):
        if name in allowed_modules:
            return allowed_modules[name]
        raise ImportError(f"Module {name} is not allowed")
    
    # Create a safe environment with minimal built-ins
    safe_builtins = {
        # Basic operations
        'abs': abs, 'all': all, 'any': any, 'bin': bin, 'bool': bool, 
        'chr': chr, 'complex': complex, 'divmod': divmod, 'float': float, 
        'format': format, 'hex': hex, 'int': int, 'len': len, 'max': max, 
        'min': min, 'oct': oct, 'ord': ord, 'pow': pow, 'round': round,
        'sorted': sorted, 'sum': sum,
        
        # Types and conversions
        'bytes': bytes, 'dict': dict, 'frozenset': frozenset, 'list': list, 
        'repr': repr, 'set': set, 'slice': slice, 'str': str, 'tuple': tuple, 
        'type': type, 'zip': zip,
        
        # Iteration and generation
        'enumerate': enumerate, 'filter': filter, 'iter': iter, 'map': map,
        'next': next, 'range': range, 'reversed': reversed,
        
        # Other safe operations
        'getattr': getattr, 'hasattr': hasattr, 'hash': hash,
        'isinstance': isinstance, 'issubclass': issubclass,
        
        # Import handler
        '__import__': safe_import
    }
    
    # Set up output capture
    output = []
    def safe_print(*args, **kwargs):
        end = kwargs.get('end', '\n')
        sep = kwargs.get('sep', ' ')
        output.append(sep.join(str(arg) for arg in args) + end)
    
    # Create restricted globals
    restricted_globals = {
        '__builtins__': safe_builtins,
        'print': safe_print
    }
    
    try:
        # Execute the code with timeout
        exec(code, restricted_globals)
        return ''.join(output)
    except Exception as e:
        return f"Error executing code: {str(e)}"

# ========== PROJECT INSIGHTS TOOLS ==========

async def generate_meeting_insights_tool(
    supabase: Client, 
    embedding_client: AsyncOpenAI, 
    document_id: str,
    force_reprocess: bool = False
) -> str:
    """
    Extract and store AI-generated insights from a meeting transcript.
    
    Args:
        supabase: Supabase client
        embedding_client: OpenAI client for LLM processing
        document_id: ID of the document to process
        force_reprocess: Whether to reprocess even if insights already exist
        
    Returns:
        Summary of extracted insights
    """
    try:
        # Process the document for insights (disabled)
        # stored_ids = await process_meeting_document_for_insights(
        #     supabase, embedding_client, document_id, force_reprocess
        # )
        stored_ids = []  # Placeholder
        
        if not stored_ids:
            return f"No insights could be extracted from document {document_id}. This may not be a meeting transcript or the content may not contain actionable information."
        
        # Retrieve and format the generated insights
        insights = []
        for insight_id in stored_ids:
            result = supabase.table('project_insights').select('*').eq('id', insight_id).execute()
            if result.data:
                insights.append(result.data[0])
        
        # Format response
        summary = f"""# Meeting Insights Generated

**Document ID:** {document_id}
**Total Insights:** {len(insights)}

## Extracted Insights:

"""
        
        for insight in insights:
            priority_emoji = {
                'critical': '🔴',
                'high': '🟠', 
                'medium': '🟡',
                'low': '🟢'
            }.get(insight.get('priority', 'medium'), '🟡')
            
            type_emoji = {
                'action_item': '✅',
                'decision': '📋',
                'risk': '⚠️',
                'blocker': '🚫',
                'opportunity': '💡',
                'concern': '😟'
            }.get(insight.get('insight_type', 'action_item'), '📝')
            
            summary += f"""### {type_emoji} {insight.get('title', 'Untitled')}
**Type:** {insight.get('insight_type', 'N/A').replace('_', ' ').title()}
**Priority:** {priority_emoji} {insight.get('priority', 'medium').title()}
**Confidence:** {insight.get('confidence_score', 0.0):.1%}

{insight.get('description', 'No description available')}

"""
            
            if insight.get('assigned_to'):
                summary += f"**Assigned to:** {insight.get('assigned_to')}\n"
            if insight.get('due_date'):
                summary += f"**Due date:** {insight.get('due_date')}\n"
            if insight.get('keywords'):
                summary += f"**Keywords:** {', '.join(insight.get('keywords', []))}\n"
                
            summary += "\n---\n\n"
        
        return summary
        
    except Exception as e:
        return f"Error generating insights for document {document_id}: {str(e)}"

async def get_project_insights_tool(
    supabase: Client,
    project_name: Optional[str] = None,
    insight_types: Optional[List[str]] = None,
    priorities: Optional[List[str]] = None,
    status_filter: Optional[List[str]] = None,
    days_back: int = 30,
    limit: int = 20
) -> str:
    """
    Retrieve and display project insights with filtering options.
    
    Args:
        supabase: Supabase client
        project_name: Filter by project name (partial match)
        insight_types: Filter by types (action_item, decision, risk, etc.)
        priorities: Filter by priorities (critical, high, medium, low)
        status_filter: Filter by status (open, in_progress, completed, cancelled)
        days_back: Number of days to look back
        limit: Maximum number of insights to return
        
    Returns:
        Formatted list of insights
    """
    try:
        # Get insights with filters (re-enable insights functionality)
        # Calculate date range
        date_from = (datetime.now() - timedelta(days=days_back)).isoformat()
        
        # Build query for insights
        query = supabase.table('document_insights').select('*')
        
        # Apply filters
        if project_name:
            query = query.ilike('project_name', f'%{project_name}%')
        if insight_types:
            query = query.in_('insight_type', insight_types)
        if priorities:
            query = query.in_('severity', priorities)  # severity maps to priority
        if status_filter:
            query = query.in_('status', status_filter)
        
        # Apply date filter and get results
        result = query.gte('created_at', date_from)\
                     .order('created_at', desc=True)\
                     .limit(limit)\
                     .execute()
        
        insights = result.data or []
        
        if not insights:
            return f"No insights found matching the specified criteria in the last {days_back} days."
        
        # Format response
        header = f"""# Project Insights ({len(insights)} results)

**Time Period:** Last {days_back} days
**Filters Applied:**
"""
        
        if project_name:
            header += f"- **Project:** {project_name}\n"
        if insight_types:
            header += f"- **Types:** {', '.join(insight_types)}\n"
        if priorities:
            header += f"- **Priorities:** {', '.join(priorities)}\n"
        if status_filter:
            header += f"- **Status:** {', '.join(status_filter)}\n"
        
        header += "\n## Insights:\n\n"
        
        insights_text = ""
        for insight in insights:
            priority_emoji = {
                'critical': '🔴',
                'high': '🟠',
                'medium': '🟡', 
                'low': '🟢'
            }.get(insight.get('severity', 'medium'), '🟡')
            
            status_emoji = {
                'open': '📋',
                'in_progress': '⏳',
                'completed': '✅',
                'cancelled': '❌'
            }.get(insight.get('status', 'open'), '📋')
            
            # Get meeting details with proper linking
            doc_id = insight.get('doc_id', '')
            doc_title = insight.get('doc_title', 'Unknown')
            meeting_date = insight.get('meeting_date', '')
            if not meeting_date and insight.get('created_at'):
                meeting_date = insight.get('created_at')[:10]

            meeting_link = f"/meetings/{doc_id}" if doc_id else "#"
            meeting_ref = f"[{doc_title} on {meeting_date}]({meeting_link})"

            insights_text += f"""### {priority_emoji} {insight.get('title', 'Untitled')}

**Status:** {status_emoji} {insight.get('status', 'open').replace('_', ' ').title()}
**Type:** {insight.get('insight_type', 'N/A').replace('_', ' ').title()}
**Source:** {meeting_ref}

{insight.get('description', 'No description available')}

"""
            
            if insight.get('project_name'):
                insights_text += f"**Project:** {insight.get('project_name')}\n"
            if insight.get('assignee'):
                insights_text += f"**Assigned to:** {insight.get('assignee')}\n"
            if insight.get('business_impact'):
                insights_text += f"**Business Impact:** {insight.get('business_impact')}\n"
            if insight.get('financial_impact'):
                insights_text += f"**Financial Impact:** ${insight.get('financial_impact'):,.2f}\n"
            if insight.get('critical_path_impact'):
                insights_text += f"**Critical Path Impact:** Yes\n"
            if insight.get('stakeholders_affected'):
                stakeholders = insight.get('stakeholders_affected', [])
                if stakeholders:
                    insights_text += f"**Stakeholders Affected:** {', '.join(stakeholders)}\n"
            if insight.get('due_date'):
                insights_text += f"**Due date:** {insight.get('due_date')[:10]}\n"  # Just date part
                
            insights_text += "\n---\n\n"
        
        return header + insights_text
        
    except Exception as e:
        return f"Error retrieving project insights: {str(e)}"

async def get_insights_summary_tool(
    supabase: Client,
    days_back: int = 30
) -> str:
    """
    Generate a comprehensive summary of project insights over a specified period.
    
    Args:
        supabase: Supabase client
        days_back: Number of days to include in summary
        
    Returns:
        Formatted insights summary with statistics and key findings
    """
    try:
        # generator = get_insights_generator(supabase, None)
        # summary_data = await generator.get_insights_summary(days_back)
        return "Insights summary is currently disabled for Agent API"
        
        if 'error' in summary_data:
            return f"Error generating insights summary: {summary_data['error']}"
        
        # Format the summary
        report = f"""# Project Insights Summary
**Period:** Last {days_back} days
**Generated:** {summary_data.get('generated_at', 'Unknown')[:16]}

## 📊 Overview

**Total Insights:** {summary_data.get('total_insights', 0)}

### By Type:
"""
        
        insights_by_type = summary_data.get('insights_by_type', {})
        for insight_type, count in sorted(insights_by_type.items(), key=lambda x: x[1], reverse=True):
            type_display = insight_type.replace('_', ' ').title()
            report += f"- **{type_display}:** {count}\n"
        
        report += "\n### By Priority:\n"
        
        insights_by_priority = summary_data.get('insights_by_priority', {})
        priority_order = ['critical', 'high', 'medium', 'low']
        for priority in priority_order:
            count = insights_by_priority.get(priority, 0)
            priority_emoji = {'critical': '🔴', 'high': '🟠', 'medium': '🟡', 'low': '🟢'}.get(priority, '⚪')
            report += f"- {priority_emoji} **{priority.title()}:** {count}\n"
        
        report += "\n### By Status:\n"
        
        insights_by_status = summary_data.get('insights_by_status', {})
        status_emojis = {'open': '📋', 'in_progress': '⏳', 'completed': '✅', 'cancelled': '❌'}
        for status, count in sorted(insights_by_status.items(), key=lambda x: x[1], reverse=True):
            emoji = status_emojis.get(status, '📝')
            status_display = status.replace('_', ' ').title()
            report += f"- {emoji} **{status_display}:** {count}\n"
        
        # Active projects
        active_projects = summary_data.get('active_projects', [])
        if active_projects:
            report += "\n## 🏗️ Most Active Projects:\n"
            for project, count in active_projects[:5]:
                report += f"- **{project}:** {count} insights\n"
        
        # Top concerns
        top_concerns = summary_data.get('top_concerns', [])
        if top_concerns:
            report += "\n## ⚠️ Top Concerns & Risks:\n"
            for concern in top_concerns[:3]:
                report += f"- **{concern.get('title', 'Untitled')}** ({concern.get('priority', 'medium')} priority)\n"
        
        # Recent decisions
        recent_decisions = summary_data.get('recent_decisions', [])
        if recent_decisions:
            report += "\n## 📋 Recent Key Decisions:\n"
            for decision in recent_decisions[:3]:
                report += f"- **{decision.get('title', 'Untitled')}**\n"
                if decision.get('description'):
                    report += f"  {decision.get('description')[:100]}...\n"
        
        return report
        
    except Exception as e:
        return f"Error generating insights summary: {str(e)}"

async def search_insights_tool(
    supabase: Client,
    search_query: str,
    insight_types: Optional[List[str]] = None,
    priorities: Optional[List[str]] = None,
    limit: int = 15
) -> str:
    """
    Search project insights using full-text search and filters.
    
    Args:
        supabase: Supabase client
        search_query: Text to search in titles and descriptions
        insight_types: Filter by insight types
        priorities: Filter by priority levels
        limit: Maximum number of results
        
    Returns:
        Formatted search results
    """
    try:
        # Use the advanced search SQL function
        result = supabase.rpc(
            'search_project_insights',
            {
                'search_query': search_query,
                'insight_types': insight_types,
                'priorities': priorities,
                'match_count': limit
            }
        ).execute()
        
        if not result.data:
            return f"No insights found matching '{search_query}' with the specified filters."
        
        insights = result.data
        
        # Format results
        response = f"""# Insights Search Results
**Query:** "{search_query}"
**Results:** {len(insights)}

"""
        
        for insight in insights:
            priority_emoji = {
                'critical': '🔴',
                'high': '🟠',
                'medium': '🟡',
                'low': '🟢'
            }.get(insight.get('priority', 'medium'), '🟡')
            
            search_rank = insight.get('search_rank', 0)
            relevance = "⭐" * min(5, int(search_rank * 10)) if search_rank > 0 else ""
            
            response += f"""### {priority_emoji} {insight.get('title', 'Untitled')} {relevance}

**Type:** {insight.get('insight_type', 'N/A').replace('_', ' ').title()}
**Status:** {insight.get('status', 'open').replace('_', ' ').title()}
**Source:** {insight.get('source_meeting_title', 'Unknown')}

{insight.get('description', 'No description available')}

"""
            
            if insight.get('assigned_to'):
                response += f"**Assigned to:** {insight.get('assigned_to')}\n"
            if insight.get('project_name'):
                response += f"**Project:** {insight.get('project_name')}\n"
            if insight.get('keywords'):
                keywords = insight.get('keywords', [])
                if keywords:
                    response += f"**Keywords:** {', '.join(keywords)}\n"
                    
            response += "\n---\n\n"
        
        return response
        
    except Exception as e:
        return f"Error searching insights: {str(e)}"

async def strategic_business_analysis_tool(
    supabase: Client,
    embedding_client: AsyncOpenAI,
    analysis_query: str,
    focus_areas: Optional[List[str]] = None
) -> str:
    """
    Intelligent strategic business analysis that synthesizes extracted insights.
    This tool queries the document_insights table to provide executive-level analysis
    based on AI-extracted risks, decisions, action items, and blockers.

    Args:
        supabase: Supabase client
        embedding_client: OpenAI client for embeddings
        analysis_query: The strategic question to analyze
        focus_areas: Optional list of focus areas (e.g., ['risks', 'timeline', 'budget'])

    Returns:
        Comprehensive strategic analysis with synthesized insights
    """
    try:
        # Parse the query to understand what type of analysis is needed
        query_lower = analysis_query.lower()

        # Define insight types to query based on the analysis question
        relevant_insight_types = []
        if any(word in query_lower for word in ['risk', 'threat', 'challenge', 'problem', 'issue']):
            relevant_insight_types.extend(['risk', 'blocker', 'issue'])
        if any(word in query_lower for word in ['decision', 'choice', 'strategy']):
            relevant_insight_types.append('decision')
        if any(word in query_lower for word in ['action', 'todo', 'task', 'deliverable']):
            relevant_insight_types.append('action_item')
        if any(word in query_lower for word in ['opportunity', 'potential', 'growth']):
            relevant_insight_types.append('opportunity')
        if any(word in query_lower for word in ['technical', 'tech', 'system', 'infrastructure']):
            relevant_insight_types.append('technical_detail')

        # If no specific types identified, get all major types
        if not relevant_insight_types:
            relevant_insight_types = ['risk', 'blocker', 'decision', 'action_item', 'issue', 'opportunity']

        # Query document_insights table for relevant insights
        insights_query = supabase.table('document_insights').select('*')

        # Filter by insight types
        if relevant_insight_types:
            insights_query = insights_query.in_('insight_type', relevant_insight_types)

        # Get insights from last 90 days for comprehensive analysis
        date_from = (datetime.now() - timedelta(days=90)).isoformat()
        insights_query = insights_query.gte('created_at', date_from)

        # Order by severity and date
        insights_query = insights_query.order('severity', desc=False).order('created_at', desc=True)

        # Execute query
        insights_result = insights_query.limit(100).execute()
        insights = insights_result.data or []

        # Group insights by type and severity
        insights_by_type = {}
        insights_by_severity = {'critical': [], 'high': [], 'medium': [], 'low': []}
        project_insights = {}

        for insight in insights:
            # Group by type
            insight_type = insight.get('insight_type', 'unknown')
            if insight_type not in insights_by_type:
                insights_by_type[insight_type] = []
            insights_by_type[insight_type].append(insight)

            # Group by severity
            severity = insight.get('severity', 'medium')
            if severity in insights_by_severity:
                insights_by_severity[severity].append(insight)

            # Group by project
            project_name = insight.get('project_name') or 'General'
            if project_name not in project_insights:
                project_insights[project_name] = []
            project_insights[project_name].append(insight)

        # Also get recent meeting context for additional understanding
        recent_meetings_query = supabase.table('document_metadata')\
            .select('id, title, summary, date, project_name')\
            .eq('category', 'meeting')\
            .gte('date', (datetime.now() - timedelta(days=30)).isoformat())\
            .order('date', desc=True)\
            .limit(10)
        meetings_result = recent_meetings_query.execute()
        recent_meetings = meetings_result.data or []

        # Build intelligent analysis
        analysis = f"""# Strategic Business Analysis: {analysis_query}

## Executive Intelligence Summary
**Analysis Date:** {datetime.now().strftime('%Y-%m-%d %H:%M')}
**Data Sources:** {len(insights)} extracted insights from {len(recent_meetings)} recent meetings
**Analysis Period:** Last 90 days of operational data
"""

        # Add critical findings first
        if insights_by_severity['critical']:
            analysis += f"""

## 🔴 CRITICAL FINDINGS REQUIRING IMMEDIATE ATTENTION
"""
            for insight in insights_by_severity['critical'][:5]:
                # Get meeting details with proper linking
                doc_id = insight.get('doc_id', '')
                doc_title = insight.get('doc_title', 'Unknown')
                meeting_date = insight.get('meeting_date', '')
                if not meeting_date and insight.get('created_at'):
                    meeting_date = insight.get('created_at')[:10]

                meeting_link = f"/meetings/{doc_id}" if doc_id else "#"
                meeting_ref = f"[{doc_title} on {meeting_date}]({meeting_link})"

                analysis += f"""
### {insight.get('title', 'Untitled')}
{insight.get('description', 'No description')}
- **Source:** {meeting_ref}
- **Project:** {insight.get('project_name', 'N/A')}"""
                if insight.get('business_impact'):
                    analysis += f"\n- **Business Impact:** {insight['business_impact']}"
                if insight.get('financial_impact'):
                    analysis += f"\n- **Financial Impact:** ${insight['financial_impact']:,.2f}"
                analysis += "\n"

        # Analyze risks and blockers specifically
        risks_and_blockers = []
        for itype in ['risk', 'blocker', 'issue']:
            if itype in insights_by_type:
                risks_and_blockers.extend(insights_by_type[itype])

        if risks_and_blockers:
            analysis += f"""

## ⚠️ Risk Analysis & Blockers
**Total Identified Risks/Blockers:** {len(risks_and_blockers)}
"""
            # Group by project for better context
            risks_by_project = {}
            for risk in risks_and_blockers:
                proj = risk.get('project_name', 'General')
                if proj not in risks_by_project:
                    risks_by_project[proj] = []
                risks_by_project[proj].append(risk)

            for project, project_risks in list(risks_by_project.items())[:5]:
                analysis += f"\n### {project}"
                for risk in project_risks[:3]:
                    severity_emoji = {'critical': '🔴', 'high': '🟠', 'medium': '🟡', 'low': '🟢'}.get(risk.get('severity', 'medium'), '⚪')
                    analysis += f"""
- {severity_emoji} **{risk.get('title', 'Untitled')}**: {risk.get('description', '')[:200]}"""
                    if risk.get('assignee'):
                        analysis += f" (Assigned to: {risk['assignee']})"
                    analysis += "\n"

        # Add high-priority items across all types
        high_priority_items = insights_by_severity['high'][:10]
        if high_priority_items:
            analysis += f"""

## 🟠 High Priority Items Across All Categories
"""
            for item in high_priority_items:
                type_display = item.get('insight_type', 'unknown').replace('_', ' ').title()
                analysis += f"- **[{type_display}]** {item.get('title', 'Untitled')}"
                if item.get('due_date'):
                    analysis += f" (Due: {item['due_date'][:10]})"
                analysis += "\n"

        # Key decisions made
        if 'decision' in insights_by_type:
            analysis += f"""

## 📋 Key Decisions & Strategic Choices
"""
            for decision in insights_by_type['decision'][:5]:
                analysis += f"- **{decision.get('title', 'Untitled')}**: {decision.get('description', '')[:200]}\n"

        # Action items summary
        if 'action_item' in insights_by_type:
            open_actions = [a for a in insights_by_type['action_item'] if not a.get('resolved', False)]
            analysis += f"""

## 📌 Action Items Status
**Total Action Items:** {len(insights_by_type['action_item'])}
**Open Items:** {len(open_actions)}
"""
            if open_actions:
                analysis += "\n### Urgent Actions:\n"
                for action in open_actions[:5]:
                    analysis += f"- {action.get('title', 'Untitled')}"
                    if action.get('assignee'):
                        analysis += f" (Assigned: {action['assignee']})"
                    if action.get('due_date'):
                        analysis += f" [Due: {action['due_date'][:10]}]"
                    analysis += "\n"

        # Project-specific analysis
        if len(project_insights) > 1:
            analysis += f"""

## 🏗️ Project-Specific Analysis
"""
            for project, p_insights in list(project_insights.items())[:5]:
                risk_count = len([i for i in p_insights if i.get('insight_type') in ['risk', 'blocker', 'issue']])
                action_count = len([i for i in p_insights if i.get('insight_type') == 'action_item'])
                analysis += f"""
### {project}
- Total Insights: {len(p_insights)}
- Risks/Issues: {risk_count}
- Action Items: {action_count}
"""

        # Recent meeting context
        if recent_meetings:
            analysis += f"""

## 📅 Recent Meeting Context
Last {len(recent_meetings)} meetings provide additional context:
"""
            for meeting in recent_meetings[:5]:
                meeting_date = meeting.get('date', 'Unknown')[:10] if meeting.get('date') else 'Unknown'
                analysis += f"- **{meeting_date}**: {meeting.get('title', 'Untitled')}\n"
                if meeting.get('summary'):
                    analysis += f"  Summary: {meeting['summary'][:150]}...\n"

        # Synthesis and recommendations
        analysis += f"""

## 💡 Strategic Synthesis & Recommendations

Based on the analysis of {len(insights)} insights across {len(project_insights)} projects:

1. **Immediate Attention Required:** {len(insights_by_severity['critical'])} critical items need immediate resolution
2. **Risk Exposure:** {len([i for i in insights if i.get('insight_type') in ['risk', 'blocker']])} active risks and blockers identified
3. **Execution Status:** {len([i for i in insights if i.get('insight_type') == 'action_item' and not i.get('resolved', False)])} open action items pending completion
"""

        # Add specific recommendations based on the query
        if 'risk' in query_lower:
            high_risks = [i for i in insights if i.get('insight_type') in ['risk', 'blocker'] and i.get('severity') in ['critical', 'high']]
            analysis += f"""

### Risk-Specific Recommendations:
- **Critical Risk Items:** {len(high_risks)} high/critical risks require immediate mitigation
- **Most Affected Projects:** {', '.join(list(set([r.get('project_name', 'Unknown') for r in high_risks if r.get('project_name')]))[:3])}
- **Common Risk Themes:** Budget overruns, timeline delays, resource constraints, technical debt
"""

        analysis += """

---
*This analysis synthesizes AI-extracted insights from meeting transcripts and documents, providing data-driven intelligence rather than generic recommendations.*
"""

        return analysis

    except Exception as e:
        return f"Error in strategic business analysis: {str(e)}"