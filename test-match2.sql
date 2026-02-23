-- 测试向量搜索
-- 使用一个已存在的向量的近似值来搜索
SELECT 
  id,
  left(content, 50) as content_preview,
  1 - (embedding <=> (SELECT embedding FROM knowledge_vectors WHERE id = 'personal-info')) as similarity
FROM knowledge_vectors
ORDER BY embedding <=> (SELECT embedding FROM knowledge_vectors WHERE id = 'personal-info')
LIMIT 5;
