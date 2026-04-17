-- 修复判断题的选项和答案
-- 判断题的选项应该是 ["0", "1"]（表示对/错）
-- 答案应该是 "0" 或 "1"

-- 检查判断题的选项格式
SELECT id, type, content, options, answer FROM questions WHERE type = 3;

-- 将判断题的答案改为 "0" 或 "1"
-- "A" 对应 "0"（正确/对）
-- "B" 对应 "1"（错误/错）
UPDATE questions SET answer = '0' WHERE type = 3 AND answer = 'A';
UPDATE questions SET answer = '1' WHERE type = 3 AND answer = 'B';
