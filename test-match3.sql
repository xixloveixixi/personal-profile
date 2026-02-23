-- 测试用文本查询搜索
-- 首先生成一个查询向量（使用已有的个人简介向量）
WITH query_embedding AS (
  SELECT embedding FROM knowledge_vectors WHERE id = 'personal-info'
)
SELECT 
  id,
  left(content, 100) as content_preview,
  1 - (embedding <=> (SELECT embedding FROM query_embedding)) as similarity
FROM knowledge_vectors
WHERE 1 - (embedding <=> (SELECT embedding FROM query_embedding)) > 0.3
ORDER BY embedding <=> (SELECT embedding FROM query_embedding)
LIMIT 5;
