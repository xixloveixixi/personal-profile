-- 启用 vector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 删除旧表
DROP TABLE IF EXISTS knowledge_vectors;

-- 创建新表，embedding 列使用 vector(1536) 类型
CREATE TABLE knowledge_vectors (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建向量索引
CREATE INDEX idx_knowledge_vectors_embedding ON knowledge_vectors USING ivfflat (embedding vector_cosine_ops);

-- 创建匹配函数
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE(
  id text,
  content text,
  metadata jsonb,
  similarity float
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

-- 验证表结构
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'knowledge_vectors';
