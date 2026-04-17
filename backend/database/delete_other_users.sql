-- ========================================
-- 删除除了 testuser 之外的所有用户
-- ========================================

USE smart_exam;

-- 显示将要删除的用户
SELECT '=== 即将删除的用户 ===' AS '';
SELECT id, username, nickname, create_time AS '注册时间'
FROM users
WHERE username != 'testuser'
ORDER BY id;

-- 询问确认
SELECT '=== 确认删除 ===' AS '';
SELECT CONCAT('将删除 ', COUNT(*), ' 个用户（除了 testuser）') AS '操作说明' FROM users WHERE username != 'testuser';
SELECT '' AS '';

-- 执行删除
DELETE FROM users WHERE username != 'testuser';

-- 显示结果
SELECT '✅ 删除完成！' AS result;
SELECT COUNT(*) AS '剩余用户数' FROM users;

-- 显示剩余用户
SELECT '=== 剩余用户 ===' AS '';
SELECT id, username, nickname FROM users;
