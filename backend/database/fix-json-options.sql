-- 修复所有题目的 options 字段为正确的 JSON 格式

USE smart_exam;

-- 更新所有选项为有效的 JSON 字符串
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 1;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 2;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 3;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 4;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 5;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 6;
UPDATE questions SET options = JSON_ARRAY('0', '1') WHERE id = 7;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 8;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 9;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 10;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 11;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 12;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 13;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 14;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 15;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 16;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 17;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 18;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 19;
UPDATE questions SET options = JSON_ARRAY('0', '1') WHERE id = 20;
UPDATE questions SET options = JSON_ARRAY('0', '1', '2', '3') WHERE id = 21;

-- 验证修复结果
SELECT id, content, options, answer
FROM questions
WHERE id IN (1, 2, 7, 20, 21);
