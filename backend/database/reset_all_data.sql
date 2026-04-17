-- ========================================
-- 清空所有用户做题数据并重置
-- ========================================

USE smart_exam;

-- 1. 显示将要操作的用户
SELECT '=== 当前用户列表 ===' AS '';
SELECT id, username, nickname FROM users ORDER BY id;

-- 2. 清空所有做题数据
SELECT '=== 清空做题数据 ===' AS '';
DELETE FROM notebook WHERE user_id IS NOT NULL;
SELECT CONCAT('✅ 已清空 notebook 表: ', ROW_COUNT(), ' 条记录') AS result;

DELETE FROM review_continuous WHERE user_id IS NOT NULL;
SELECT CONCAT('✅ 已清空 review_continuous 表: ', ROW_COUNT(), ' 条记录') AS result;

DELETE FROM review_records WHERE user_id IS NOT NULL;
SELECT CONCAT('✅ 已清空 review_records 表: ', ROW_COUNT(), ' 条记录') AS result;

DELETE FROM practice_records WHERE user_id IS NOT NULL;
SELECT CONCAT('✅ 已清空 practice_records 表: ', ROW_COUNT(), ' 条记录') AS result;

-- 3. 显示当前状态
SELECT '=== 用户数据状态 ===' AS '';
SELECT
  u.id AS user_id,
  u.username,
  (SELECT COUNT(*) FROM practice_records WHERE user_id = u.id) as practice_count,
  (SELECT COUNT(*) FROM review_records WHERE user_id = u.id) as review_count,
  (SELECT COUNT(*) FROM notebook WHERE user_id = u.id) as notebook_count,
  (SELECT continuous_days FROM review_continuous WHERE user_id = u.id) as continuous_days
FROM users u
ORDER BY u.id;

-- 4. 重置 review_records 初始化记录（状态=0）
SELECT '=== 重置复习记录初始化 ===' AS '';
UPDATE review_records
SET correct_count = 0, total_review_count = 0, memory_level = 50, status = 0
WHERE user_id IS NOT NULL;

SELECT '✅ 所有用户数据已重置为0' AS result;
SELECT '⚠️  请清除浏览器缓存后再注册新用户' AS warning;
