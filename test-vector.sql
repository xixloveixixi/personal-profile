-- 测试向量搜索是否工作
-- 先插入一条测试数据
INSERT INTO knowledge_vectors (id, content, embedding, metadata)
VALUES (
  'test-1',
  '测试内容：湖南科技大学',
  (SELECT array_agg(random())::vector(1536) FROM generate_series(1, 1536)),
  '{"type": "test"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  content = EXCLUDED.content,
  embedding = EXCLUDED.embedding,
  metadata = EXCLUDED.metadata;

-- 测试查询
SELECT 
  id,
  content,
  metadata,
  1 - (embedding <=> (SELECT array_agg(random())::vector(1536) FROM generate_series(1, 1536))) as similarity
FROM knowledge_vectors
WHERE id = 'test-1';

-- 测试 match_knowledge 函数
SELECT * FROM match_knowledge(
  (SELECT array_agg(random())::vector(1536) FROM generate_series(1, 1536)),
  0.5,
  5
);
