-- Advanced RAG Functions for Enhanced Search Capabilities

-- Enhanced document matching with similarity scores
CREATE OR REPLACE FUNCTION match_documents_with_score(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.content,
    d.metadata,
    (1 - (d.embedding <=> query_embedding)) as similarity
  FROM documents d
  WHERE (1 - (d.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Keyword-based document search for hybrid RAG
CREATE OR REPLACE FUNCTION search_documents_by_keywords(
  search_terms text[],
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  keyword_match_score float
)
LANGUAGE plpgsql
AS $$
DECLARE
  search_query text;
  term text;
BEGIN
  -- Build full-text search query
  search_query := '';
  FOREACH term IN ARRAY search_terms
  LOOP
    IF search_query <> '' THEN
      search_query := search_query || ' | ';
    END IF;
    search_query := search_query || term || ':*';
  END LOOP;
  
  RETURN QUERY
  SELECT 
    d.id,
    d.content,
    d.metadata,
    ts_rank_cd(to_tsvector('english', d.content), to_tsquery('english', search_query)) as keyword_match_score
  FROM documents d
  WHERE to_tsvector('english', d.content) @@ to_tsquery('english', search_query)
  ORDER BY ts_rank_cd(to_tsvector('english', d.content), to_tsquery('english', search_query)) DESC
  LIMIT match_count;
END;
$$;

-- Search documents by speaker (for meeting transcripts)
CREATE OR REPLACE FUNCTION search_documents_by_speaker(
  speaker_name text,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  speaker_relevance float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.content,
    d.metadata,
    CASE 
      WHEN d.metadata->>'speakers' IS NOT NULL AND d.metadata->>'speakers' ILIKE '%' || speaker_name || '%' THEN 1.0
      WHEN d.content ILIKE '%' || speaker_name || ':%' THEN 0.8
      WHEN d.content ILIKE '%' || speaker_name || '%' THEN 0.5
      ELSE 0.0
    END as speaker_relevance
  FROM documents d
  WHERE 
    (d.metadata->>'speakers' ILIKE '%' || speaker_name || '%')
    OR (d.content ILIKE '%' || speaker_name || ':%')
    OR (d.content ILIKE '%' || speaker_name || '%')
  ORDER BY speaker_relevance DESC, d.created_at DESC
  LIMIT match_count;
END;
$$;

-- Get documents within a date range with content type filtering
CREATE OR REPLACE FUNCTION get_documents_by_date_range(
  start_date timestamp DEFAULT NOW() - INTERVAL '7 days',
  end_date timestamp DEFAULT NOW(),
  content_types text[] DEFAULT NULL,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  created_at timestamp with time zone,
  content_type text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.content,
    d.metadata,
    d.created_at,
    CASE 
      WHEN d.metadata->>'file_title' ILIKE '%transcript%' OR d.metadata->>'file_title' ILIKE '%meeting%' THEN 'meeting_transcript'
      WHEN d.metadata->>'file_title' ILIKE '%report%' THEN 'report'
      WHEN d.content LIKE '%Speaker%:%' OR d.content LIKE '%:%' THEN 'conversational'
      WHEN d.metadata->>'mime_type' LIKE 'image%' THEN 'image'
      ELSE 'document'
    END as content_type
  FROM documents d
  WHERE 
    d.created_at >= start_date 
    AND d.created_at <= end_date
    AND (
      content_types IS NULL 
      OR CASE 
        WHEN d.metadata->>'file_title' ILIKE '%transcript%' OR d.metadata->>'file_title' ILIKE '%meeting%' THEN 'meeting_transcript'
        WHEN d.metadata->>'file_title' ILIKE '%report%' THEN 'report'
        WHEN d.content LIKE '%Speaker%:%' OR d.content LIKE '%:%' THEN 'conversational'
        WHEN d.metadata->>'mime_type' LIKE 'image%' THEN 'image'
        ELSE 'document'
      END = ANY(content_types)
    )
  ORDER BY d.created_at DESC
  LIMIT match_count;
END;
$$;

-- Advanced multi-modal search combining semantic, keyword, and metadata
CREATE OR REPLACE FUNCTION multi_modal_search(
  query_embedding vector(1536) DEFAULT NULL,
  search_terms text[] DEFAULT NULL,
  speaker_filter text DEFAULT NULL,
  date_start timestamp DEFAULT NULL,
  date_end timestamp DEFAULT NULL,
  content_types text[] DEFAULT NULL,
  match_count int DEFAULT 10,
  semantic_weight float DEFAULT 0.5,
  keyword_weight float DEFAULT 0.3,
  metadata_weight float DEFAULT 0.2
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  created_at timestamp with time zone,
  combined_score float,
  semantic_score float,
  keyword_score float,
  metadata_score float
)
LANGUAGE plpgsql
AS $$
DECLARE
  search_query text;
  term text;
BEGIN
  -- Build keyword search query if terms provided
  IF search_terms IS NOT NULL AND array_length(search_terms, 1) > 0 THEN
    search_query := '';
    FOREACH term IN ARRAY search_terms
    LOOP
      IF search_query <> '' THEN
        search_query := search_query || ' | ';
      END IF;
      search_query := search_query || term || ':*';
    END LOOP;
  END IF;
  
  RETURN QUERY
  SELECT 
    d.id,
    d.content,
    d.metadata,
    d.created_at,
    -- Combined weighted score
    (
      COALESCE(
        CASE WHEN query_embedding IS NOT NULL THEN 
          (1 - (d.embedding <=> query_embedding)) * semantic_weight 
        ELSE 0 END, 0
      ) +
      COALESCE(
        CASE WHEN search_query IS NOT NULL THEN 
          ts_rank_cd(to_tsvector('english', d.content), to_tsquery('english', search_query)) * keyword_weight
        ELSE 0 END, 0
      ) +
      -- Metadata score based on recency and relevance
      (
        CASE 
          WHEN speaker_filter IS NOT NULL AND (
            d.metadata->>'speakers' ILIKE '%' || speaker_filter || '%'
            OR d.content ILIKE '%' || speaker_filter || ':%'
          ) THEN 0.3
          ELSE 0.0
        END +
        CASE 
          WHEN d.created_at > NOW() - INTERVAL '1 day' THEN 0.2
          WHEN d.created_at > NOW() - INTERVAL '7 days' THEN 0.1
          ELSE 0.0
        END
      ) * metadata_weight
    ) as combined_score,
    
    -- Individual scores for analysis
    COALESCE(
      CASE WHEN query_embedding IS NOT NULL THEN 
        (1 - (d.embedding <=> query_embedding))
      ELSE 0 END, 0
    ) as semantic_score,
    
    COALESCE(
      CASE WHEN search_query IS NOT NULL THEN 
        ts_rank_cd(to_tsvector('english', d.content), to_tsquery('english', search_query))
      ELSE 0 END, 0
    ) as keyword_score,
    
    (
      CASE 
        WHEN speaker_filter IS NOT NULL AND (
          d.metadata->>'speakers' ILIKE '%' || speaker_filter || '%'
          OR d.content ILIKE '%' || speaker_filter || ':%'
        ) THEN 0.5
        ELSE 0.0
      END +
      CASE 
        WHEN d.created_at > NOW() - INTERVAL '1 day' THEN 0.4
        WHEN d.created_at > NOW() - INTERVAL '7 days' THEN 0.2
        ELSE 0.0
      END
    ) as metadata_score
    
  FROM documents d
  WHERE 
    -- Date filters
    (date_start IS NULL OR d.created_at >= date_start)
    AND (date_end IS NULL OR d.created_at <= date_end)
    
    -- Content type filter
    AND (
      content_types IS NULL 
      OR CASE 
        WHEN d.metadata->>'file_title' ILIKE '%transcript%' OR d.metadata->>'file_title' ILIKE '%meeting%' THEN 'meeting_transcript'
        WHEN d.metadata->>'file_title' ILIKE '%report%' THEN 'report'
        WHEN d.content LIKE '%Speaker%:%' OR d.content LIKE '%:%' THEN 'conversational'
        WHEN d.metadata->>'mime_type' LIKE 'image%' THEN 'image'
        ELSE 'document'
      END = ANY(content_types)
    )
    
    -- Speaker filter
    AND (
      speaker_filter IS NULL 
      OR d.metadata->>'speakers' ILIKE '%' || speaker_filter || '%'
      OR d.content ILIKE '%' || speaker_filter || ':%'
    )
    
    -- Ensure we have some relevance
    AND (
      query_embedding IS NULL 
      OR (1 - (d.embedding <=> query_embedding)) > 0.5
      OR search_query IS NULL 
      OR to_tsvector('english', d.content) @@ to_tsquery('english', search_query)
    )
    
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Get conversation context around a specific document (for meeting transcripts)
CREATE OR REPLACE FUNCTION get_conversation_context(
  document_id bigint,
  context_window int DEFAULT 2
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  position_relative int,
  is_target boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
  target_doc RECORD;
  file_id_val text;
BEGIN
  -- Get the target document details
  SELECT * INTO target_doc FROM documents WHERE id = document_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Extract file_id from metadata
  file_id_val := target_doc.metadata->>'file_id';
  
  IF file_id_val IS NULL THEN
    -- Return just the target document if no file_id
    RETURN QUERY
    SELECT 
      target_doc.id,
      target_doc.content,
      target_doc.metadata,
      0 as position_relative,
      true as is_target;
    RETURN;
  END IF;
  
  -- Get surrounding documents from the same file
  RETURN QUERY
  WITH numbered_docs AS (
    SELECT 
      d.*,
      ROW_NUMBER() OVER (ORDER BY d.id) as row_num
    FROM documents d
    WHERE d.metadata->>'file_id' = file_id_val
  ),
  target_row AS (
    SELECT row_num as target_row_num
    FROM numbered_docs
    WHERE id = document_id
  )
  SELECT 
    nd.id,
    nd.content,
    nd.metadata,
    (nd.row_num - tr.target_row_num)::int as position_relative,
    (nd.id = document_id) as is_target
  FROM numbered_docs nd
  CROSS JOIN target_row tr
  WHERE nd.row_num BETWEEN (tr.target_row_num - context_window) AND (tr.target_row_num + context_window)
  ORDER BY nd.row_num;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_metadata_speakers ON documents USING GIN ((metadata->>'speakers'));
CREATE INDEX IF NOT EXISTS idx_documents_metadata_file_title ON documents USING GIN ((metadata->>'file_title'));
CREATE INDEX IF NOT EXISTS idx_documents_content_fts ON documents USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_documents_created_at_desc ON documents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_metadata_file_id ON documents USING GIN ((metadata->>'file_id'));

-- Add comment for documentation
COMMENT ON FUNCTION match_documents_with_score IS 'Enhanced semantic search with similarity scores and thresholds';
COMMENT ON FUNCTION search_documents_by_keywords IS 'Keyword-based full-text search for hybrid RAG strategies';
COMMENT ON FUNCTION search_documents_by_speaker IS 'Search documents by speaker name for meeting transcripts';
COMMENT ON FUNCTION get_documents_by_date_range IS 'Retrieve documents within date range with content type filtering';
COMMENT ON FUNCTION multi_modal_search IS 'Advanced search combining semantic, keyword, and metadata signals';
COMMENT ON FUNCTION get_conversation_context IS 'Get conversation context around a specific document chunk';