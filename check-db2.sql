-- 直接查询数据库中的向量
SELECT 
  id,
  pg_typeof(embedding) as embedding_type,
  embedding::text as embedding_text
FROM knowledge_vectors 
WHERE id = 'personal-info';
