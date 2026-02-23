-- 测试 match_knowledge 函数
-- 先检查表中是否有数据
SELECT COUNT(*) as total_count FROM knowledge_vectors;

-- 查看一条数据
SELECT id, left(content, 100) as content_preview 
FROM knowledge_vectors 
LIMIT 1;
