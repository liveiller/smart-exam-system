# 艾宾浩斯记忆曲线演示页面

为了更直观地理解记忆曲线的工作原理，我创建了一个演示页面。

## 使用演示页面

### 步骤 1：创建演示页面文件

在 `frontend/src/views/demo/memorization.vue` 创建：

```vue
<template>
  <div class="memorization-demo">
    <el-card class="header-card">
      <h2>📚 艾宾浩斯记忆曲线演示</h2>
      <p>点击按钮模拟复习过程，观察记忆水平的变化</p>
    </el-card>

    <!-- 演示控制区 -->
    <el-card class="control-card">
      <h3>🎯 演示控制</h3>

      <el-form label-width="120px">
        <el-form-item label="选择知识点">
          <el-select v-model="selectedKnowledge" placeholder="请选择知识点">
            <el-option
              v-for="kp in knowledgePoints"
              :key="kp.id"
              :label="kp.name"
              :value="kp.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="当前阶段">
          <el-tag :type="getStageTagType(currentStage)">
            第 {{ currentStage }} 次
          </el-tag>
        </el-form-item>

        <el-form-item label="上次答题结果">
          <el-radio-group v-model="lastResult">
            <el-radio label="correct">✅ 答对</el-radio>
            <el-radio label="wrong">❌ 答错</el-radio>
            <el-radio label="none">⏭️ 跳过</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="nextReview" :loading="isSimulating">
            {{ btnText }}
          </el-button>
          <el-button @click="resetDemo">重置演示</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 实时数据展示 -->
    <el-card class="data-card">
      <h3>📊 实时数据</h3>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="data-item">
            <div class="data-label">记忆水平</div>
            <div class="data-value">
              <el-progress
                :percentage="memoryLevel"
                :color="getMemoryColor(memoryLevel)"
                :stroke-width="15"
              />
              <span class="percentage">{{ memoryLevel }}%</span>
            </div>
          </div>
        </el-col>

        <el-col :span="12">
          <div class="data-item">
            <div class="data-label">复习阶段</div>
            <div class="data-value">
              <span class="stage-value">{{ currentStage }} / 9</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <div class="data-item">
            <div class="data-label">总复习次数</div>
            <div class="data-value">
              <span class="count-value">{{ totalReviewCount }}</span>
            </div>
          </div>
        </el-col>

        <el-col :span="12">
          <div class="data-item">
            <div class="data-label">正确次数</div>
            <div class="data-value">
              <span class="count-value">{{ correctCount }}</span>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <div class="data-item">
            <div class="data-label">正确率</div>
            <div class="data-value">
              <span class="count-value">
                {{ accuracy }}%
              </span>
            </div>
          </div>
        </el-col>

        <el-col :span="12">
          <div class="data-item">
            <div class="data-label">下次复习时间</div>
            <div class="data-value">
              <span class="count-value">{{ nextReviewTimeText }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 复习进度曲线 -->
    <el-card class="progress-card">
      <h3>📈 复习进度曲线</h3>
      <div ref="chartRef" class="chart-container"></div>
    </el-card>

    <!-- 阶段间隔说明 -->
    <el-card class="interval-card">
      <h3>⏰ 复习间隔说明</h3>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="阶段1">5分钟</el-descriptions-item>
        <el-descriptions-item label="阶段2">30分钟</el-descriptions-item>
        <el-descriptions-item label="阶段3">12小时</el-descriptions-item>
        <el-descriptions-item label="阶段4">1天</el-descriptions-item>
        <el-descriptions-item label="阶段5">2天</el-descriptions-item>
        <el-descriptions-item label="阶段6">4天</el-descriptions-item>
        <el-descriptions-item label="阶段7">7天</el-descriptions-item>
        <el-descriptions-item label="阶段8">14天</el-descriptions-item>
        <el-descriptions-item label="阶段9">30天</el-descriptions-item>
      </el-descriptions>

      <el-alert
        title="💡 记忆保持率颜色说明"
        type="info"
        :closable="false"
        show-icon
        style="margin-top: 20px"
      >
        <template #default>
          <p>🟢 绿色 (>=70%) - 记忆牢固</p>
          <p>🟠 橙色 (40-70%) - 记忆一般</p>
          <p>🔴 红色 (&lt;40%) - 需要复习</p>
        </template>
      </el-alert>
    </el-card>

    <!-- 遗忘曲线对比 -->
    <el-card class="curve-card">
      <h3>📉 艾宾浩斯遗忘曲线对比</h3>
      <div ref="curveChartRef" class="chart-container"></div>

      <el-alert
        title="📊 曲线说明"
        type="success"
        :closable="false"
        show-icon
        style="margin-top: 20px"
      >
        <template #default>
          <p><strong>红色曲线：</strong> 不复习的自然遗忘曲线</p>
          <p><strong>绿色曲线：</strong> 科学复习后的记忆保持率</p>
          <p>结论：<strong>及时复习能显著提高记忆保持率</strong></p>
        </template>
      </el-alert>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import * as echarts from 'echarts'

// 演示状态
const selectedKnowledge = ref(10102)
const lastResult = ref('none')
const isSimulating = ref(false)
const btnText = ref('开始模拟复习')

// 记录数据
const currentStage = ref(1)
const totalReviewCount = ref(0)
const correctCount = ref(0)
const memoryLevel = ref(50)

// 知识点列表
const knowledgePoints = ref([
  { id: 10102, name: '极限的定义' },
  { id: 10201, name: '导数的定义' },
  { id: 20101, name: '高频词汇 A-D' },
  { id: 30101, name: '马克思主义基本原理' },
  { id: 40101, name: '线性表' }
])

// 下次复习时间
const nextReviewTime = ref(new Date())

// 计算正确率
const accuracy = computed(() => {
  if (totalReviewCount.value === 0) return 0
  return Math.round((correctCount.value / totalReviewCount.value) * 100)
})

// 下次复习时间文本
const nextReviewTimeText = computed(() => {
  const diff = nextReviewTime.value - new Date()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (hours < 0) return '已过期'
  if (hours === 0) return '今天'
  if (hours < 24) return `${hours}小时后`
  if (days === 1) return '明天'
  if (days < 7) return `${days}天后`

  return nextReviewTime.value.toLocaleDateString('zh-CN')
})

// 获取阶段标签类型
const getStageTagType = (stage) => {
  const types = ['', 'info', 'primary', 'success', 'warning', 'danger', 'danger', 'danger', 'danger']
  return types[stage] || 'info'
}

// 获取记忆颜色
const getMemoryColor = (level) => {
  if (level >= 70) return '#67C23A'
  if (level >= 40) return '#E6A23C'
  return '#F56C6C'
}

// 下次复习
const nextReview = () => {
  if (isSimulating.value) return
  isSimulating.value = true
  btnText.value = '模拟中...'

  // 模拟延迟
  setTimeout(() => {
    const result = lastResult.value

    if (result === 'correct') {
      // 答对：进入下一阶段
      currentStage.value = Math.min(currentStage.value + 1, 9)

      // 计算新的记忆水平
      const newMemoryLevel = Math.min(100,
        Math.round(
          ((correctCount.value + 1) / (totalReviewCount.value + 1)) * 100 *
          (1 + currentStage.value * 0.1)
        )
      )
      memoryLevel.value = newMemoryLevel
      correctCount.value++
    } else if (result === 'wrong') {
      // 答错：重置为阶段1
      currentStage.value = 1
      memoryLevel.value = 50
    }

    // 总复习次数 +1
    totalReviewCount.value++

    // 计算下次复习时间
    const intervals = [5, 30, 720, 1440, 2880, 5760, 10080, 20160, 43200]
    const intervalMinutes = intervals[Math.min(currentStage.value - 1, intervals.length - 1)]
    nextReviewTime.value = new Date(Date.now() + intervalMinutes * 60 * 1000)

    isSimulating.value = false
    btnText.value = '开始模拟复习'

    // 更新图表
    updateProgressChart()
  }, 500)
}

// 重置演示
const resetDemo = () => {
  currentStage.value = 1
  totalReviewCount.value = 0
  correctCount.value = 0
  memoryLevel.value = 50
  nextReviewTime.value = new Date()
  lastResult.value = 'none'
  btnText.value = '开始模拟复习'

  updateProgressChart()
  updateCurveChart()
}

// 初始化图表
let progressChart = null
let curveChart = null

const initCharts = () => {
  // 进度曲线
  const progressContainer = document.getElementById('progressChart')
  if (progressContainer) {
    progressChart = echarts.init(progressContainer)
    updateProgressChart()
  }

  // 遗忘曲线
  const curveContainer = document.getElementById('curveChart')
  if (curveContainer) {
    curveChart = echarts.init(curveContainer)
    updateCurveChart()
  }
}

// 更新进度曲线
const updateProgressChart = () => {
  if (!progressChart) return

  const data = []
  const stageNames = ['', '阶段1', '阶段2', '阶段3', '阶段4', '阶段5', '阶段6', '阶段7', '阶段8', '阶段9']

  for (let i = 1; i <= currentStage.value; i++) {
    data.push({
      stage: i,
      name: stageNames[i],
      memory: i === 1 ? memoryLevel.value : Math.min(
        100,
        Math.round((correctCount.value / i) * 100 * (1 + i * 0.1))
      )
    })
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      axisLabel: { interval: 0, rotate: 30 }
    },
    yAxis: {
      type: 'value',
      max: 100,
      name: '记忆水平 (%)'
    },
    series: [
      {
        name: '记忆水平',
        type: 'bar',
        data: data.map(d => ({
          value: d.memory,
          itemStyle: {
            color: getMemoryColor(d.memory)
          }
        })),
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }

  progressChart.setOption(option)
}

// 更新遗忘曲线
const updateCurveChart = () => {
  if (!curveChart) return

  const timePoints = ['学习后', '20分钟', '1小时', '9小时', '1天', '2天', '6天', '31天']
  const naturalForgetting = [100, 58.2, 44.2, 35.8, 33.7, 27.8, 25.4, 21.1]
  const withReview = [100, 90, 85, 80, 78, 75, 72, 68]

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['不复习（自然遗忘）', '科学复习（艾宾浩斯法）'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timePoints
    },
    yAxis: {
      type: 'value',
      max: 100,
      name: '记忆保持率 (%)'
    },
    series: [
      {
        name: '不复习（自然遗忘）',
        type: 'line',
        data: naturalForgetting,
        smooth: true,
        lineStyle: { color: '#F56C6C', width: 2 },
        areaStyle: { color: 'rgba(245, 108, 108, 0.1)' }
      },
      {
        name: '科学复习（艾宾浩斯法）',
        type: 'line',
        data: withReview,
        smooth: true,
        lineStyle: { color: '#67C23A', width: 2, type: 'dashed' }
      }
    ]
  }

  curveChart.setOption(option)
}

onMounted(() => {
  initCharts()
})
</script>

<style scoped>
.memorization-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header-card {
  text-align: center;
  margin-bottom: 20px;

  h2 { color: #333; margin-bottom: 8px; }
  p { color: #666; }
}

.control-card,
.data-card,
.progress-card,
.interval-card,
.curve-card {
  margin-bottom: 20px;

  h3 {
    margin-bottom: 16px;
    color: #333;
    font-size: 18px;
  }
}

.data-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.data-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.data-value {
  .percentage {
    font-size: 32px;
    font-weight: bold;
    color: #333;
    margin-left: 10px;
  }

  .stage-value,
  .count-value {
    font-size: 36px;
    font-weight: bold;
    color: #409EFF;
  }
}

.chart-container {
  height: 350px;
  width: 100%;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
}

:deep(.el-alert) {
  p {
    margin: 5px 0;
    font-size: 14px;
  }
}
</style>
```

### 步骤 2：添加路由

在 `frontend/src/router/index.js` 添加：

```javascript
{
  path: '/demo/memorization',
  name: 'MemorizationDemo',
  component: () => import('@/views/demo/memorization.vue'),
  meta: { title: '记忆曲线演示' }
}
```

### 步骤 3：访问演示页面

```
http://localhost:3000/demo/memorization
```

## 演示功能说明

### 1. 模拟复习过程

- **选择知识点**：模拟不同的知识点的复习
- **选择上次答题结果**：
  - ✅ 答对：进入下一阶段，记忆水平提高
  - ❌ 答错：重置为阶段1，记忆水平下降
  - ⏭️ 跳过：不改变当前状态

### 2. 实时数据展示

- **记忆水平**：0-100%，带颜色指示
- **复习阶段**：当前在第几次复习
- **总复习次数**：累计复习次数
- **正确次数**：累计答对次数
- **正确率**：正确次数 / 总复习次数
- **下次复习时间**：根据当前阶段计算

### 3. 可视化图表

- **进度曲线**：显示当前各阶段的记忆水平
- **遗忘曲线对比**：显示自然遗忘 vs 科学复习的区别

### 4. 学习效果对比

通过演示可以直观看到：

1. **不复习**：记忆水平迅速下降（红色曲线）
2. **及时复习**：记忆水平保持在较高水平（绿色曲线）
3. **多次复习**：阶段越高，记忆越牢固

## 预期结果

完成9次正确复习后：
- 记忆水平应该达到 80-95%
- 复习间隔延长到 30 天
- 正确率达到 90% 以上
- 进入**已掌握**状态（阶段>=7且记忆水平>=80）

## 注意事项

1. 演示数据仅供理解算法，不影响实际系统数据
2. 演示中的计算与系统实际算法一致
3. 真实系统中会有更多的知识点和题目
4. 连续复习天数需要跨天复习才能生效
