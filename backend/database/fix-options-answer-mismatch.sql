-- 修复选项和答案不匹配的问题
-- 当前选项是 ["0", "1", "2", "3"]，但答案是 "C" 或 "BC"
-- 需要将答案改为对应的数字

-- 单选题：答案从 A/B/C/D 改为 0/1/2/3
UPDATE questions SET answer = '0' WHERE type = 1 AND answer = 'A';
UPDATE questions SET answer = '1' WHERE type = 1 AND answer = 'B';
UPDATE questions SET answer = '2' WHERE type = 1 AND answer = 'C';
UPDATE questions SET answer = '3' WHERE type = 1 AND answer = 'D';

-- 多选题：答案从 AB/AC/BC/ABC 等改为对应的数字
-- 例如：AB -> 01, AC -> 02, BC -> 12, ABC -> 012, ABD -> 013
UPDATE questions SET answer = '01' WHERE type = 2 AND answer = 'AB';
UPDATE questions SET answer = '02' WHERE type = 2 AND answer = 'AC';
UPDATE questions SET answer = '03' WHERE type = 2 AND answer = 'AD';
UPDATE questions SET answer = '12' WHERE type = 2 AND answer = 'BC';
UPDATE questions SET answer = '13' WHERE type = 2 AND answer = 'BD';
UPDATE questions SET answer = '23' WHERE type = 2 AND answer = 'CD';
UPDATE questions SET answer = '012' WHERE type = 2 AND answer = 'ABC';
UPDATE questions SET answer = '013' WHERE type = 2 AND answer = 'ABD';
UPDATE questions SET answer = '023' WHERE type = 2 AND answer = 'ACD';
UPDATE questions SET answer = '123' WHERE type = 2 AND answer = 'BCD';

-- 验证修复结果
SELECT id, type, content, options, answer FROM questions LIMIT 10;
