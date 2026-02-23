-- 检查 vector 扩展是否已安装
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 检查 vector 类型是否存在
SELECT typname, typtype 
FROM pg_type 
WHERE typname LIKE '%vector%';

-- 检查当前数据库的扩展
SELECT extname, extversion FROM pg_extension;
