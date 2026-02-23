-- 测试相似度计算
WITH query_vec AS (
  SELECT embedding as qv FROM knowledge_vectors WHERE id = 'timeline-info-0'
)
SELECT 
  kv.id,
  left(kv.content, 50) as content_preview,
  1 - (kv.embedding <=> (SELECT qv FROM query_vec)) as similarity
FROM knowledge_vectors kv
ORDER BY kv.embedding <=> (SELECT qv FROM query_vec)
LIMIT 5;
