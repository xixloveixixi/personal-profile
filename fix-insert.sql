-- 创建一个辅助函数来正确插入向量
CREATE OR REPLACE FUNCTION insert_vector(
  p_id TEXT,
  p_content TEXT,
  p_embedding FLOAT[],
  p_metadata JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO knowledge_vectors (id, content, embedding, metadata)
  VALUES (p_id, p_content, p_embedding::vector(1536), p_metadata)
  ON CONFLICT (id) DO UPDATE SET
    content = EXCLUDED.content,
    embedding = EXCLUDED.embedding,
    metadata = EXCLUDED.metadata;
END;
$$ LANGUAGE plpgsql;
