-- 创建一个使用 SQL 直接查询的匹配函数
-- 这个函数接收 float[] 数组，内部转换为 vector

CREATE OR REPLACE FUNCTION match_knowledge_sql(
  query_embedding FLOAT[],
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE(
  id TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_vec VECTOR(1536);
BEGIN
  -- 将 float[] 转换为 vector
  query_vec := query_embedding::VECTOR(1536);
  
  RETURN QUERY
  SELECT
    kv.id,
    kv.content,
    kv.metadata,
    (1 - (kv.embedding <=> query_vec))::FLOAT as similarity
  FROM knowledge_vectors kv
  WHERE kv.embedding IS NOT NULL
    AND 1 - (kv.embedding <=> query_vec) > match_threshold
  ORDER BY kv.embedding <=> query_vec
  LIMIT match_count;
END;
$$;

-- 测试函数
SELECT * FROM match_knowledge_sql(
  (SELECT embedding::FLOAT[] FROM knowledge_vectors WHERE id = 'personal-info'),
  0.3,
  5
);
