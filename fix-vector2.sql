-- 方法1: 使用 schema 前缀
DROP TABLE IF EXISTS public.knowledge_vectors;

-- 确保在正确的 schema 中创建
CREATE TABLE public.knowledge_vectors (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  embedding public.vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_knowledge_vectors_embedding ON public.knowledge_vectors 
USING ivfflat (embedding vector_cosine_ops);

-- 验证
SELECT 
  column_name, 
  data_type, 
  udt_name,
  udt_schema
FROM information_schema.columns 
WHERE table_name = 'knowledge_vectors' AND table_schema = 'public';
