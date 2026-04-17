-- ========================================
-- 彻底清空所有练习相关数据
-- ========================================

USE smart_exam;

-- 显示当前用户数据
SELECT '=== 当前用户数据 ===' AS '';
SELECT id, username, nickname FROM users ORDER BY id;

-- 显示将要清空的数据
SELECT '=== 练习记录统计 ===' AS '';
SELECT 'practice_records' AS table_name, COUNT(*) AS count FROM practice_records
UNION ALL
SELECT 'notebook', COUNT(*) FROM notebook
UNION ALL
SELECT 'review_records', COUNT(*) FROM review_records
UNION ALL
SELECT 'review_continuous', COUNT(*) FROM review_continuous;

-- 询问确认
SELECT '=== 确认清空 ===' AS '';
SELECT CONCAT('将清空所有用户的练习数据，共 ', COALESCE(SUM(cnt), 0), ' 条记录') AS '操作说明'
FROM (
  SELECT COUNT(*) AS cnt FROM practice_records
  UNION ALL
  SELECT COUNT(*) FROM notebook
  UNION ALL
  SELECT COUNT(*) FROM review_records
  UNION ALL
  SELECT COUNT(*) FROM review_continuous
) AS counts;

-- 执行清空
DELETE FROM practice_records WHERE user_id IS NOT NULL;
DELETE FROM notebook WHERE user_id IS NOT NULL;
DELETE FROM review_records WHERE user_id IS NOT NULL;
DELETE FROM review_continuous WHERE user_id IS NOT NULL;

-- 重置复习记录状态
UPDATE review_records SET correct_count = 0, total_review_count = 0, memory_level = 50, status = 0 WHERE user_id IS NOT NULL;

-- 显示结果
SELECT '✅ 数据已清空！' AS result;
SELECT '=== 清空后的统计 ===' AS '';
SELECT 'practice_records' AS table_name, COUNT(*) AS count FROM practice_records
UNION ALL
SELECT 'notebook', COUNT(*) FROM notebook
UNION ALL
SELECT 'review_records', COUNT(*) FROM review_records
UNION ALL
SELECT 'review_continuous', COUNT(*) FROM review_continuous;
