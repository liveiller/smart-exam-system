-- 清空所有用户的做题数据为0
USE smart_exam;

-- 显示当前用户数据
SELECT '=== 当前用户数据 ===' AS '';
SELECT
  u.id AS user_id,
  u.username,
  (SELECT COUNT(*) FROM practice_records WHERE user_id = u.id) as practice_count,
  (SELECT COUNT(*) FROM review_records WHERE user_id = u.id) as review_count,
  (SELECT COUNT(*) FROM notebook WHERE user_id = u.id) as notebook_count,
  (SELECT continuous_days FROM review_continuous WHERE user_id = u.id) as continuous_days
FROM users u
ORDER BY u.id;

-- 询问是否继续
SELECT '是否清空所有用户的做题数据？' AS '提示';
SELECT '请手动执行: DELETE FROM notebook WHERE user_id IS NOT NULL;' AS '操作1';
SELECT '请手动执行: DELETE FROM review_continuous WHERE user_id IS NOT NULL;' AS '操作2';
SELECT '请手动执行: DELETE FROM review_records WHERE user_id IS NOT NULL;' AS '操作3';
SELECT '请手动执行: DELETE FROM practice_records WHERE user_id IS NOT NULL;' AS '操作4';
