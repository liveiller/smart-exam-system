-- 检查用户数据状态脚本
USE smart_exam;

-- 查看所有用户信息
SELECT
  u.id AS user_id,
  u.username,
  u.nickname,
  COUNT(p.id) AS practice_records,
  COUNT(r.id) AS review_records,
  COUNT(n.id) AS notebook_items,
  COUNT(rc.id) AS continuous_records
FROM users u
LEFT JOIN practice_records p ON u.id = p.user_id
LEFT JOIN review_records r ON u.id = r.user_id
LEFT JOIN notebook n ON u.id = n.user_id
LEFT JOIN review_continuous rc ON u.id = rc.user_id
GROUP BY u.id, u.username, u.nickname
ORDER BY u.id;
