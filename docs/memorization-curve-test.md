# 艾宾浩斯记忆曲线功能检查指南

## 功能概述

系统实现了完整的艾宾浩斯记忆曲线算法，用于科学安排复习计划。核心功能包括：

1. **遗忘曲线计算**：基于经典艾宾浩斯实验数据
2. **复习间隔**：5分钟 → 30分钟 → 12小时 → 1天 → 2天 → 4天 → 7天 → 14天 → 30天
3. **记忆保持率**：根据复习阶段和正确率动态计算
4. **连续复习统计**：跟踪用户的连续学习天数

## 核心算法实现

### 1. 前端算法（`frontend/src/utils/ebbinghaus.js`）

```javascript
// 复习间隔（分钟）
REVIEW_INTERVALS_MINUTES = [5, 30, 720, 1440, 2880, 5760, 10080, 20160, 43200]

// 记忆衰减系数
DECAY_FACTOR = 1.84

// 基础遗忘曲线（不复习的情况）
FORGETTING_CURVE = [100, 58.2, 44.2, 35.8, 33.7, 27.8, 25.4, 21.1]
```

### 2. 后端实现（`backend/src/controllers/reviewController.js`）

后端同步实现了复习间隔和记忆水平计算逻辑。

## 测试方法

### 方法一：手动测试（推荐新手使用）

#### 步骤 1：启动系统

```bash
# 终端 1 - 启动后端
cd backend
npm install
npm run dev

# 终端 2 - 启动前端
cd frontend
npm install
npm run dev
```

访问：`http://localhost:3000`

#### 步骤 2：创建测试账号

1. 访问 `/register` 注册新账号
2. 访问 `/login` 登录

#### 步骤 3：刷题以创建复习记录

1. 进入 **刷题练习** 页面
2. 选择科目和知识点
3. 开始答题，至少答对 2-3 道题
4. 进入 **智能复习** 页面，查看复习任务

#### 步骤 4：检查记忆曲线功能

在智能复习页面检查：

1. **统计卡片**
   - 今日待复习数量（应该是你的题目数）
   - 今日已完成数量（应该是0）
   - 连续复习天数（应该是1）
   - 平均记忆保持率（应该是50-80之间）

2. **艾宾浩斯曲线图**
   - 应该显示两条曲线：自然遗忘和科学复习
   - 自然遗忘曲线：100% → 58.2% → 44.2% → 35.8% → 33.7% → 27.8% → 25.4% → 21.1%
   - 科学复习曲线：应该保持在较高水平（68%-90%）

3. **今日复习任务列表**
   - 显示知识点、学科、题目数
   - 显示复习阶段（第几次）
   - 显示记忆水平（带进度条颜色）
   - 显示下次复习时间

#### 步骤 5：测试复习流程

1. 进入今日复习任务列表
2. 点击 **开始复习** 或 **复习** 按钮
3. 在答题页面选择正确答案
4. 提交后查看：
   - 记忆水平是否提高
   - 复习阶段是否升级（答对）
   - 下次复习时间是否更新

### 方法二：自动化测试

#### 测试脚本 1：前端函数测试

创建文件 `test-ebbinghaus.js`：

```javascript
// 测试前端记忆曲线函数
import {
  calculateMemoryLevel,
  calculateNextReviewTime,
  getStageIntervalText,
  getStageTagType,
  getMemoryColor,
  formatNextReviewTime,
  getEbbinghausCurveData,
  createReviewRecord,
  updateReviewRecord
} from './src/utils/ebbinghaus.js'

console.log('=== 艾宾浩斯记忆曲线函数测试 ===\n')

// 1. 测试记忆水平计算
console.log('1. 记忆水平计算测试:')
const record1 = {
  reviewStage: 1,
  correctCount: 0,
  totalReviewCount: 0,
  lastReviewTime: new Date().toISOString()
}
console.log(`   初始记忆水平: ${calculateMemoryLevel(record1)}%`)

const record2 = {
  reviewStage: 1,
  correctCount: 1,
  totalReviewCount: 1,
  lastReviewTime: new Date().toISOString()
}
console.log(`   答对后记忆水平: ${calculateMemoryLevel(record2)}%`)

const record3 = {
  reviewStage: 3,
  correctCount: 2,
  totalReviewCount: 2,
  lastReviewTime: new Date().toISOString()
}
console.log(`   第3次答对: ${calculateMemoryLevel(record3)}%`)

// 2. 测试复习间隔
console.log('\n2. 复习间隔测试:')
console.log('   阶段1:', getStageIntervalText(1))
console.log('   阶段2:', getStageIntervalText(2))
console.log('   阶段3:', getStageIntervalText(3))
console.log('   阶段4:', getStageIntervalText(4))
console.log('   阶段7:', getStageIntervalText(7))

// 3. 测试记忆水平颜色
console.log('\n3. 记忆水平颜色测试:')
console.log('   >=70% (绿色):', getMemoryColor(80))
console.log('   40-70% (橙色):', getMemoryColor(50))
console.log('   <40% (红色):', getMemoryColor(30))

// 4. 测试下次复习时间
console.log('\n4. 下次复习时间测试:')
const now = new Date()
const nextTime = calculateNextReviewTime({ reviewStage: 1 }, true)
const diffHours = (nextTime - now) / (1000 * 60 * 60)
console.log(`   第1次答对后的间隔: 约 ${Math.round(diffHours)} 小时 (应该是5分钟)`)

const nextTime2 = calculateNextReviewTime({ reviewStage: 2 }, true)
const diffHours2 = (nextTime2 - now) / (1000 * 60 * 60)
console.log(`   第2次答对后的间隔: 约 ${Math.round(diffHours2)} 小时 (应该是30分钟)`)

// 5. 测试艾宾浩斯曲线数据
console.log('\n5. 艾宾浩斯曲线数据:')
const curve = getEbbinghausCurveData()
console.log('   时间点:', curve.timePoints.join(' → '))
console.log('   自然遗忘:', curve.naturalForgetting.map(v => v + '%').join(' → '))
console.log('   科学复习:', curve.withReview.map(v => v + '%').join(' → '))

// 6. 测试创建复习记录
console.log('\n6. 创建复习记录测试:')
const testQuestion = {
  id: 1,
  knowledgeId: 10102
}
const newRecord = createReviewRecord(testQuestion, true)
console.log('   记录ID:', newRecord.id.substring(0, 8) + '...')
console.log('   知识点ID:', newRecord.knowledgeId)
console.log('   复习阶段:', newRecord.reviewStage)
console.log('   记忆水平:', newRecord.memoryLevel + '%')
console.log('   下次复习时间:', new Date(newRecord.nextReviewTime).toLocaleString())

// 7. 测试更新复习记录
console.log('\n7. 更新复习记录测试:')
const updatedRecord = updateReviewRecord(newRecord, true)
console.log('   更新后阶段:', updatedRecord.reviewStage)
console.log('   更新后正确数:', updatedRecord.correctCount)
console.log('   更新后总次数:', updatedRecord.totalReviewCount)
console.log('   更新后记忆水平:', updatedRecord.memoryLevel + '%')

console.log('\n✅ 所有测试完成！')
```

运行测试：

```bash
cd frontend
node test-ebbinghaus.js
```

#### 测试脚本 2：后端 API 测试

创建文件 `test-review-api.sh`：

```bash
#!/bin/bash

# 艾宾浩斯记忆曲线后端 API 测试
BASE_URL="http://localhost:3001"

echo "=== 艾宾浩斯记忆曲线后端 API 测试 ==="
echo ""

# 1. 测试登录获取 Token
echo "1. 登录测试"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "   ❌ 登录失败，请先注册账号"
  exit 1
fi

echo "   ✅ 登录成功"
echo ""

# 2. 测试获取今日复习任务
echo "2. 获取今日复习任务"
TASKS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/review/tasks" \
  -H "Authorization: Bearer $TOKEN")

echo $TASKS_RESPONSE | jq '.' 2>/dev/null || echo $TASKS_RESPONSE
echo ""

# 3. 测试获取艾宾浩斯曲线
echo "3. 获取艾宾浩斯曲线数据"
CURVE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/review/curve")

echo $CURVE_RESPONSE | jq '.data' 2>/dev/null || echo $CURVE_RESPONSE
echo ""

# 4. 测试提交复习结果
echo "4. 提交复习结果测试"

# 首先获取复习题目
QUESTIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/review/questions?count=2" \
  -H "Authorization: Bearer $TOKEN")

QUESTION_ID=$(echo $QUESTIONS_RESPONSE | jq -r '.data[0].id' 2>/dev/null)

if [ -n "$QUESTION_ID" ]; then
  # 提交正确答案
  SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/review/submit" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"results\": [{\"questionId\": $QUESTION_ID, \"isCorrect\": true}]
    }")

  echo $SUBMIT_RESPONSE | jq '.' 2>/dev/null || echo $SUBMIT_RESPONSE
  echo "   ✅ 复习结果提交成功"
else
  echo "   ⚠️  没有复习记录，无法测试提交功能"
fi

echo ""

# 5. 测试获取复习统计
echo "5. 获取复习统计"
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/review/stats" \
  -H "Authorization: Bearer $TOKEN")

echo $STATS_RESPONSE | jq '.data' 2>/dev/null || echo $STATS_RESPONSE
echo ""

echo "=== 测试完成 ==="
```

运行测试：

```bash
cd backend
chmod +x ../test-review-api.sh
bash ../test-review-api.sh
```

### 方法三：数据库验证

```sql
-- 1. 查看复习记录表结构
DESCRIBE review_records;

-- 2. 查看当前用户的复习记录
SELECT
  id,
  question_id,
  review_stage,
  correct_count,
  total_review_count,
  memory_level,
  last_review_time,
  next_review_time,
  status
FROM review_records
WHERE user_id = 1
ORDER BY next_review_time DESC
LIMIT 10;

-- 3. 验证复习间隔逻辑
-- 下次复习时间应该是当前时间加上相应的分钟数
SELECT
  review_stage,
  CASE
    WHEN review_stage = 1 THEN 5
    WHEN review_stage = 2 THEN 30
    WHEN review_stage = 3 THEN 720
    WHEN review_stage = 4 THEN 1440
    WHEN review_stage = 5 THEN 2880
    WHEN review_stage = 6 THEN 5760
    WHEN review_stage = 7 THEN 10080
    WHEN review_stage = 8 THEN 20160
    WHEN review_stage = 9 THEN 43200
  END as expected_minutes,
  TIMESTAMPDIFF(MINUTE, last_review_time, next_review_time) as actual_minutes,
  memory_level
FROM review_records
WHERE user_id = 1
ORDER BY id DESC
LIMIT 5;

-- 4. 查看连续复习记录
SELECT
  user_id,
  continuous_days,
  last_review_date,
  DATE_ADD(last_review_date, INTERVAL continuous_days DAY) as expected_last_date
FROM review_continuous
WHERE user_id = 1;

-- 5. 计算实际记忆保持率
SELECT
  review_stage,
  correct_count,
  total_review_count,
  ROUND(correct_count / total_review_count * 100, 2) as actual_rate,
  memory_level as calculated_level,
  CASE
    WHEN memory_level >= 70 THEN '优秀'
    WHEN memory_level >= 40 THEN '良好'
    ELSE '需加强'
  END as level_category
FROM review_records
WHERE user_id = 1
ORDER BY id DESC;
```

## 功能检查清单

### ✅ 前端功能

- [ ] 页面正确加载复习统计
- [ ] 艾宾浩斯曲线图正确渲染
- [ ] 今日任务列表正确显示
- [ ] 记忆水平颜色正确（绿色>=70，橙色40-70，红色<40）
- [ ] 复习阶段标签类型正确
- [ ] 下次复习时间格式正确

### ✅ 后端功能

- [ ] 获取今日任务 API 正常返回
- [ ] 获取复习题目 API 正常返回
- [ ] 提交复习结果 API 正常处理
- [ ] 获取复习统计 API 正常返回
- [ ] 获取艾宾浩斯曲线 API 正常返回
- [ ] 连续复习天数正确计算

### ✅ 算法逻辑

- [ ] 复习间隔正确（5min, 30min, 12h, 1d, 2d, 4d, 7d, 14d, 30d）
- [ ] 记忆水平计算正确
- [ ] 答对进入下一阶段，答错重置为阶段1
- [ ] 掌握标准：阶段>=7 且 记忆水平>=80 标记为已掌握
- [ ] 连续复习天数正确递增、中断重置

## 常见问题排查

### 问题1：没有复习任务

**原因**：可能还没有复习记录或时间还没到

**解决**：
1. 先刷题创建练习记录
2. 等待题目进入复习周期
3. 或者手动在数据库插入测试数据

### 问题2：记忆水平一直是50%

**原因**：total_review_count 为0或正确率为0

**解决**：
- 确保提交复习时正确统计了答题结果
- 检查数据库中的 correct_count 和 total_review_count

### 问题3：下次复习时间计算错误

**原因**：last_review_time 或 next_review_time 时间格式问题

**解决**：
```sql
-- 检查时间字段格式
SELECT id, last_review_time, next_review_time FROM review_records LIMIT 1;
```

### 问题4：图表不显示

**原因**：ECharts 未正确加载或容器尺寸问题

**解决**：
1. 检查浏览器控制台是否有错误
2. 确保容器有明确的高度
3. 尝试手动刷新页面

## 性能测试

### 并发测试

```bash
# 使用 Apache Bench 测试 API 响应时间
ab -n 1000 -c 10 -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/review/tasks
```

### 数据库查询优化

```sql
-- 检查索引是否生效
EXPLAIN SELECT * FROM review_records WHERE user_id = 1 AND status = 0;

-- 检查表大小
SELECT
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = 'smart_exam' AND table_name LIKE 'review%';
```

## 测试结果记录

测试日期：____________________
测试人：____________________
测试结果：____________________
发现问题：____________________
备注：____________________
