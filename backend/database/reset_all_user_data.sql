-- 清空所有用户的做题数据为0
USE smart_exam;

-- 删除所有用户的做题记录
DELETE FROM notebook WHERE user_id IS NOT NULL;
DELETE FROM review_continuous WHERE user_id IS NOT NULL;
DELETE FROM review_records WHERE user_id IS NOT NULL;
DELETE FROM practice_records WHERE user_id IS NOT NULL;

-- 显示结果
SELECT '✅ 所有用户数据已清空' AS result;

-- 显示当前状态
SELECT
  u.id AS user_id,
  u.username,
  (SELECT COUNT(*) FROM practice_records WHERE user_id = u.id) as practice_count,
  (SELECT COUNT(*) FROM review_records WHERE user_id = u.id) as review_count,
  (SELECT COUNT(*) FROM notebook WHERE user_id = u.id) as notebook_count,
  (SELECT continuous_days FROM review_continuous WHERE user_id = u.id) as continuous_days
FROM users u
ORDER BY u.id;
