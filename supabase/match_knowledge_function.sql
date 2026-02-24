-- 创建向量相似度搜索函数
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_vectors.id,
    knowledge_vectors.content,
    knowledge_vectors.metadata,
    1 - (knowledge_vectors.embedding <=> query_embedding) AS similarity
  FROM knowledge_vectors
  WHERE 1 - (knowledge_vectors.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_vectors.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 如果向量维度不同，请修改 VECTOR(1536) 为实际的维度
-- 阿里云 text-embedding-v1 的维度是 1536
