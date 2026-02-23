-- 直接查询数据库中的向量
SELECT 
  id,
  pg_typeof(embedding) as embedding_type,
  array_length(embedding::float[], 1) as array_length,
  left(embedding::text, 50) as embedding_preview
FROM knowledge_vectors 
WHERE id = 'personal-info';
