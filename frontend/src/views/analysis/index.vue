<template>
  <div class="analysis">
    <!-- 标题 -->
    <div class="page-header">
      <h2>📊 靶向分析</h2>
      <p>基于知识图谱的薄弱点分析，精准定位知识盲区</p>
    </div>

    <!-- 学科选择 -->
    <el-card class="subject-card">
      <el-radio-group v-model="currentSubject" size="large" @change="handleSubjectChange">
        <el-radio-button v-for="s in subjects" :key="s.id" :value="s.id">
          {{ s.icon }} {{ s.name }}
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <el-row :gutter="20">
      <!-- 左侧：雷达图 -->
      <el-col :span="12">
        <el-card class="radar-card">
          <template #header>
            <span>🎯 知识点掌握情况雷达图</span>
          </template>
          <div ref="radarChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 右侧：整体统计 -->
      <el-col :span="12">
        <el-card class="stats-card">
          <template #header>
            <span>📈 整体掌握情况</span>
          </template>

          <div class="overall-stats">
            <div class="stat-item">
              <div class="stat-value primary">{{ overallStats.masteryRate }}%</div>
              <div class="stat-label">整体掌握率</div>
              <el-progress
                :percentage="overallStats.masteryRate"
                :color="getProgressColor(overallStats.masteryRate)"
                :stroke-width="10"
              />
            </div>

            <el-row :gutter="20" class="detail-stats">
              <el-col :span="8">
                <div class="detail-item">
                  <div class="value">{{ overallStats.totalQuestions }}</div>
                  <div class="label">总题数</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="detail-item">
                  <div class="value success">{{ overallStats.correctQuestions }}</div>
                  <div class="label">答对题数</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="detail-item">
                  <div class="value danger">{{ overallStats.wrongQuestions }}</div>
                  <div class="label">答错题数</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 薄弱点 Top 5 -->
        <el-card class="weak-top-card">
          <template #header>
            <span>⚠️ 薄弱知识点 TOP 5</span>
          </template>

          <div class="weak-list">
            <div
              v-for="(item, index) in weakTop5"
              :key="item.id"
              class="weak-item"
              @click="showRecommendation(item)"
            >
              <div class="rank" :class="getRankClass(index)">{{ index + 1 }}</div>
              <div class="info">
                <div class="name">{{ item.name }}</div>
                <el-progress
                  :percentage="item.mastery || 0"
                  :color="getProgressColor(item.mastery)"
                  :stroke-width="6"
                />
              </div>
              <div class="score" :style="{ color: getProgressColor(item.mastery) }">
                {{ item.mastery || 0 }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 知识图谱树 -->
    <el-card class="knowledge-tree-card">
      <template #header>
        <span>🌳 知识图谱</span>
      </template>

      <el-table
        :data="knowledgeTree"
        row-key="id"
        :tree-props="{ children: 'children' }"
        style="width: 100%"
        :empty-text="emptyText"
      >
        <el-table-column prop="name" label="知识点" min-width="200">
          <template #default="{ row }">
            <span :style="{ paddingLeft: (row.level - 1) * 20 + 'px' }">
              {{ row.level === 1 ? '📁' : '📄' }} {{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="totalQuestions" label="总题数" width="100" align="center" />
        <el-table-column prop="answeredQuestions" label="已答题数" width="100" align="center" />
        <el-table-column prop="correctRate" label="正确率" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="row.correctRate"
              :color="getProgressColor(row.correctRate)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="masteryLevel" label="掌握程度" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getMasteryTagType(row.masteryLevel)">
              {{ getMasteryText(row.masteryLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button
              v-if="row.level === 2"
              type="primary"
              link
              @click="practiceKnowledge(row)"
            >
              针对性练习
            </el-button>
            <el-button
              v-if="row.level === 2"
              type="success"
              link
              @click="showRecommendation(row)"
            >
              推荐
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 推荐练习对话框 -->
    <el-dialog
      v-model="showRecommendDialog"
      title="📚 针对性练习推荐"
      width="600px"
    >
      <div v-if="currentWeakPoint" class="recommend-content">
        <div class="weak-info">
          <h4>{{ currentWeakPoint.name }}</h4>
          <p>当前掌握程度：{{ currentWeakPoint.mastery }}%</p>
          <p class="suggestion">{{ getSuggestion(currentWeakPoint.mastery) }}</p>
        </div>

        <div class="recommend-questions">
          <h5>推荐题目（{{ recommendQuestions.length }} 道）</h5>
          <el-table :data="recommendQuestions" style="width: 100%">
            <el-table-column prop="content" label="题目">
              <template #default="{ row }">
                {{ truncateContent(row.content, 40) }}
              </template>
            </el-table-column>
            <el-table-column prop="difficulty" label="难度" width="80">
              <template #default="{ row }">
                <el-tag :type="getDifficultyTag(row.difficulty)" size="small">
                  {{ getDifficultyText(row.difficulty) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <el-button @click="showRecommendDialog = false">关闭</el-button>
        <el-button type="primary" @click="startRecommendedPractice">
          开始练习
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { request } from '@/api/index'
import { useRouter, useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { subjects } from '@/data/subjects'
import {
  getRadarChartData,
  getWeakKnowledgeTop,
  getKnowledgeTreeData,
  getOverallStats,
  getRecommendQuestions,
  getProgressColor,
  getMasteryText,
  getMasteryTagType
} from '@/utils/analysis'

const router = useRouter()
const route = useRoute()

// 当前学科
const currentSubject = ref(1)

// 图表
const radarChartRef = ref(null)
let radarChart = null

// 整体统计
const overallStats = reactive({
  masteryRate: 0,
  totalQuestions: 0,
  answeredQuestions: 0,
  correctQuestions: 0,
  wrongQuestions: 0
})

// 薄弱点 Top 5
const weakTop5 = ref([])

// 知识图谱树
const knowledgeTree = ref([])

// 雷达图数据
const radarData = ref({
  indicators: [],
  values: []
})

// 对话框
const showRecommendDialog = ref(false)
const currentWeakPoint = ref(null)
const recommendQuestions = ref([])

const emptyText = '暂无数据，先去刷题吧！'

// 获取排名样式
const getRankClass = (index) => {
  if (index === 0) return 'first'
  if (index === 1) return 'second'
  if (index === 2) return 'third'
  return ''
}

// 截断内容
const truncateContent = (content, length = 30) => {
  if (!content) return ''
  return content.length > length ? content.slice(0, length) + '...' : content
}

// 获取难度标签
const getDifficultyTag = (difficulty) => {
  const tags = ['', 'success', 'warning', 'danger']
  return tags[difficulty] || 'info'
}

const getDifficultyText = (difficulty) => {
  const texts = ['', '简单', '中等', '困难']
  return texts[difficulty] || '未知'
}

// 获取建议
const getSuggestion = (mastery) => {
  if (mastery < 40) return '建议从基础概念开始，多做基础题巩固理解。'
  if (mastery < 60) return '建议加强练习，重点关注易错题型。'
  if (mastery < 80) return '掌握程度良好，可以挑战一些中等难度题目。'
  return '掌握程度优秀，可以尝试高难度题目提升能力。'
}

// 渲染雷达图
const renderRadarChart = () => {
  console.log('渲染雷达图...', radarChartRef.value, radarData.value)
  if (!radarChartRef.value) {
    console.warn('雷达图容器不存在')
    return
  }

  if (!radarChart) {
    console.log('初始化雷达图实例')
    radarChart = echarts.init(radarChartRef.value)
  }

  const option = {
    radar: {
      indicator: radarData.value.indicators,
      shape: 'circle',
      center: ['50%', '50%'],
      radius: '65%',
      axisName: {
        color: '#333',
        fontSize: 11
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: radarData.value.values,
        name: '掌握程度',
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.3)'
        },
        lineStyle: {
          color: '#409EFF',
          width: 2
        },
        itemStyle: {
          color: '#409EFF'
        }
      }]
    }]
  }

  console.log('雷达图配置:', option)
  radarChart.setOption(option)
}

// 加载所有数据
const loadData = async () => {
  try {
    // 从后端获取数据，传递学科参数
    const statsData = await request.get(`/analysis/stats?subjectId=${currentSubject.value}`)

    if (statsData.code === 200) {
      const stats = statsData.data

      // 整体统计
      overallStats.masteryRate = stats.masteryRate || 0
      overallStats.totalQuestions = stats.totalQuestions || 0
      overallStats.answeredQuestions = stats.answeredQuestions || 0
      overallStats.correctQuestions = stats.correctQuestions || 0
      overallStats.wrongQuestions = stats.wrongQuestions || 0

      // 获取雷达图数据
      const radarResponse = await request.get(`/analysis/radar?subjectId=${currentSubject.value}`)
      if (radarResponse.code === 200) {
        radarData.value = {
          indicators: radarResponse.data.indicators,
          values: radarResponse.data.values
        }
      }

      // 获取薄弱点
      const weakData = await request.get(`/analysis/weak?subjectId=${currentSubject.value}&limit=5`)

      if (weakData.code === 200) {
        weakTop5.value = weakData.data || []
      }

      // 获取知识图谱
      const treeData = await request.get(`/analysis/tree?subjectId=${currentSubject.value}`)

      if (treeData.code === 200) {
        knowledgeTree.value = treeData.data || []
      }
    } else {
      console.error('获取分析数据失败:', statsData.message)
    }

    // 渲染雷达图
    nextTick(() => {
      console.log('准备渲染雷达图')
      renderRadarChart()
    })
  } catch (error) {
    console.error('加载分析数据失败:', error)
    // 初始化为 0
    overallStats.masteryRate = 0
    overallStats.totalQuestions = 0
    overallStats.answeredQuestions = 0
    overallStats.correctQuestions = 0
    overallStats.wrongQuestions = 0
    radarData.value = { indicators: [], values: [] }
    weakTop5.value = []
    knowledgeTree.value = []
  }
}

// 学科变更
const handleSubjectChange = () => {
  loadData()
}

// 显示推荐
const showRecommendation = (item) => {
  currentWeakPoint.value = item
  recommendQuestions.value = getRecommendQuestions(item.id, 5)
  showRecommendDialog.value = true
}

// 针对性练习
const practiceKnowledge = (row) => {
  localStorage.setItem('currentPractice', JSON.stringify({
    knowledgeId: row.id,
    questionCount: 10,
    difficulty: 0
  }))
  router.push('/practice/doing')
}

// 开始推荐练习
const startRecommendedPractice = () => {
  if (currentWeakPoint.value) {
    localStorage.setItem('currentPractice', JSON.stringify({
      knowledgeId: currentWeakPoint.value.id,
      questionCount: 10,
      difficulty: 0
    }))
    showRecommendDialog.value = false
    router.push('/practice/doing')
  }
}

// 窗口大小变化时重绘图表
window.addEventListener('resize', () => {
  radarChart?.resize()
})

onMounted(() => {
  console.log('靶向分析页面已挂载')
  loadData()
})

// 监听路由变化，当导航到靶向分析页面时刷新数据
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/analysis') {
      console.log('导航到靶向分析页面，刷新数据')
      loadData()
    }
  }
)
</script>

<style lang="scss" scoped>
.analysis {
  .page-header {
    margin-bottom: 24px;

    h2 {
      font-size: 24px;
      color: #333;
      margin-bottom: 8px;
    }

    p {
      color: #999;
    }
  }

  .subject-card {
    margin-bottom: 20px;
    text-align: center;
  }

  .radar-card,
  .stats-card {
    margin-bottom: 20px;

    .chart-container {
      height: 350px;
    }
  }

  .overall-stats {
    .stat-item {
      text-align: center;
      margin-bottom: 24px;

      .stat-value {
        font-size: 48px;
        font-weight: bold;

        &.primary {
          color: #409EFF;
        }
      }

      .stat-label {
        color: #999;
        margin-bottom: 16px;
      }
    }

    .detail-stats {
      .detail-item {
        text-align: center;
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;

        .value {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;

          &.primary {
            color: #409EFF;
          }

          &.success {
            color: #67C23A;
          }

          &.danger {
            color: #F56C6C;
          }
        }

        .label {
          color: #999;
          font-size: 14px;
        }
      }
    }
  }

  .weak-top-card {
    margin-bottom: 20px;

    .weak-list {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .weak-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: #f5f7fa;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #e6e8eb;
        }

        .rank {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          margin-right: 12px;
          flex-shrink: 0;

          &.first {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: white;
          }

          &.second {
            background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
            color: white;
          }

          &.third {
            background: linear-gradient(135deg, #CD7F32, #B87333);
            color: white;
          }
        }

        .info {
          flex: 1;

          .name {
            font-size: 14px;
            color: #333;
            margin-bottom: 4px;
          }

          .el-progress {
            margin-top: 4px;
          }
        }

        .score {
          font-size: 18px;
          font-weight: bold;
        }
      }
    }
  }

  .knowledge-tree-card {
    margin-bottom: 20px;
  }

  .recommend-content {
    .weak-info {
      margin-bottom: 24px;

      h4 {
        font-size: 16px;
        color: #333;
        margin-bottom: 8px;
      }

      p {
        color: #666;
        font-size: 14px;
        line-height: 1.6;

        &.suggestion {
          margin-top: 8px;
          padding: 12px;
          background: #f0f9ff;
          border-left: 3px solid #409EFF;
          border-radius: 4px;
        }
      }
    }

    .recommend-questions {
      h5 {
        font-size: 14px;
        color: #333;
        margin-bottom: 12px;
      }
    }
  }
}
</style>
