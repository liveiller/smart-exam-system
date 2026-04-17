-- 修复所有题库中的选项和答案问题

-- 问题1: x²-4x+3=0的解是x=1或x=3
UPDATE questions SET answer = '1' WHERE id = 1;

-- 问题4: 关于连续性的多选题
UPDATE questions SET
  options = JSON_ARRAY('e^x', '1/x', '|x|', 'ln(x)'),
  answer = '02',
  analysis = 'e^x和|x|在x=0处连续，1/x在x=0无定义不连续，ln(x)在x=0无定义不连续'
WHERE id = 4;

-- 问题5: 导数的几何意义
UPDATE questions SET
  options = JSON_ARRAY('函数的极值', '切线斜率', '函数的导数', '函数的增量'),
  answer = '1'
WHERE id = 5;

-- 问题6: e^x的导数
UPDATE questions SET
  options = JSON_ARRAY('e^x', 'xe^(x-1)', 'x·e^x', 'e^(x+1)'),
  answer = '0'
WHERE id = 6;

-- 问题7: 判断题 - 无限个无穷小的和
UPDATE questions SET
  options = JSON_ARRAY('正确', '错误'),
  answer = '1'
WHERE id = 7;

-- 问题8: 英语词汇题 - ubiquitous
UPDATE questions SET
  options = JSON_ARRAY('rare', 'everywhere', 'ancient', 'temporary'),
  answer = '1'
WHERE id = 8;

-- 问题9: 英语时态题
UPDATE questions SET
  options = JSON_ARRAY('goes', 'went', 'going', 'gone'),
  answer = '1'
WHERE id = 9;

-- 问题10: 阅读理解 - 主旨题
UPDATE questions SET
  options = JSON_ARRAY('The history of AI', 'AI applications today', 'Future of AI', 'AI limitations'),
  answer = '1'
WHERE id = 10;

-- 问题11: 英语词汇题 - benevolent
UPDATE questions SET
  options = JSON_ARRAY('kind', 'cruel', 'strict', 'weak'),
  answer = '0'
WHERE id = 11;

-- 问题12: 阅读理解 - 原因题
UPDATE questions SET
  options = JSON_ARRAY('Lack of funding', 'Technical complexity', 'Security concerns', 'All of the above'),
  answer = '3'
WHERE id = 12;

-- 问题13: 马克思主义哲学
UPDATE questions SET
  options = JSON_ARRAY('物质', '意识', '实践', '认识'),
  answer = '0'
WHERE id = 13;

-- 问题14: 毛泽东思想形成标志
UPDATE questions SET
  options = JSON_ARRAY('《星星之火，可以燎原》', '《论持久战》', '《新民主主义论》', '《矛盾论》'),
  answer = '0'
WHERE id = 14;

-- 问题15: 矛盾关系
UPDATE questions SET
  options = JSON_ARRAY('同一关系', '共性与个性', '对立关系', '因果关系'),
  answer = '1'
WHERE id = 15;

-- 问题16: 栈的特点
UPDATE questions SET
  options = JSON_ARRAY('先进先出', '后进先出', '随机访问', '按优先级'),
  answer = '1'
WHERE id = 16;

-- 问题17: 二叉树前序遍历
UPDATE questions SET
  options = JSON_ARRAY('根左右', '左根右', '左右根', '左右根'),
  answer = '0'
WHERE id = 17;

-- 问题18: HTTP默认端口
UPDATE questions SET
  options = JSON_ARRAY('21', '8080', '80', '443'),
  answer = '2'
WHERE id = 18;

-- 问题19: 进程三种状态
UPDATE questions SET
  options = JSON_ARRAY('运行、就绪、阻塞', '创建、运行、销毁', '运行、等待、终止', '就绪、执行、完成'),
  answer = '0'
WHERE id = 19;

-- 问题20: 判断题 - 队列特性
UPDATE questions SET
  options = JSON_ARRAY('正确', '错误'),
  answer = '0'
WHERE id = 20;

-- 问题21: 满二叉树节点数
UPDATE questions SET
  options = JSON_ARRAY('1个', '0个', '2个', '不确定'),
  answer = '0'
WHERE id = 21;

-- 验证修复结果
SELECT id, type, content,
       JSON_EXTRACT(options, '$[0]') as optionA,
       JSON_EXTRACT(options, '$[1]') as optionB,
       JSON_EXTRACT(options, '$[2]') as optionC,
       JSON_EXTRACT(options, '$[3]') as optionD,
       answer, analysis
FROM questions
ORDER BY id;
