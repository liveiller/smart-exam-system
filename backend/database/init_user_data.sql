-- 用户数据初始化脚本
-- 功能：将所有用户的做题记录初始化为0

USE smart_exam;

-- 重置练习记录
UPDATE practice_records
SET
  question_count = 0,
  correct_count = 0,
  accuracy = 0.00,
  elapsed_time = 0
WHERE 1=1;

-- 重置复习记录
UPDATE review_records
SET
  correct_count = 0,
  total_review_count = 1,
  memory_level = 50,
  status = 0
WHERE 1=1;

-- 重置错题本
UPDATE notebook
SET
  wrong_count = 1,
  mastered = 0,
  notes = NULL,
  tags = NULL
WHERE 1=1;

-- 重置连续复习记录
UPDATE review_continuous
SET
  continuous_days = 1,
  last_review_date = CURRENT_DATE
WHERE 1=1;

-- 重置用户的学习目标（可选）
UPDATE users
SET
  daily_goal = 50,
  weekly_days = 6,
  status = 1
WHERE 1=1;

SELECT '用户数据初始化完成！' AS message;
