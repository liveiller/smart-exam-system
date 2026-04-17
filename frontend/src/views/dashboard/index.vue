<template>
  <div class="dashboard">
    <div class="welcome-section">
      <div class="welcome-content">
        <div>
          <h1>👋 欢迎回来，{{ userStore.userName }}</h1>
          <p class="date">{{ currentDate }}</p>
        </div>
        <el-button @click="refreshData" :loading="loading" type="primary" plain>
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon primary">
              <el-icon :size="32"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.studyDays }}</div>
              <div class="stat-label">学习天数</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon success">
              <el-icon :size="32"><Edit /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalQuestions }}</div>
              <div class="stat-label">累计刷题</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon warning">
              <el-icon :size="32"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingReview }}</div>
              <div class="stat-label">待复习</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon danger">
              <el-icon :size="32"><Trophy /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.accuracy }}%</div>
              <div class="stat-label">正确率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-row :gutter="20" class="quick-row">
      <el-col :span="8">
        <el-card class="quick-card" shadow="hover" @click="$router.push('/practice/start')">
          <div class="quick-icon">
            <el-icon :size="40"><Edit /></el-icon>
          </div>
          <h3>开始刷题</h3>
          <p>选择科目和知识点开始练习</p>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="quick-card" shadow="hover" @click="$router.push('/review')">
          <div class="quick-icon">
            <el-icon :size="40"><Clock /></el-icon>
          </div>
          <h3>智能复习</h3>
          <p>基于艾宾浩斯记忆曲线科学复习</p>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="quick-card" shadow="hover" @click="$router.push('/analysis')">
          <div class="quick-icon">
            <el-icon :size="40"><PieChart /></el-icon>
          </div>
          <h3>薄弱分析</h3>
          <p>查看知识图谱与掌握情况</p>
        </el-card>
      </el-col>
    </el-row>

    <!-- 今日复习任务 -->
    <el-card class="task-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>📋 今日复习任务</span>
          <el-button type="primary" link @click="$router.push('/review')">
            查看全部
          </el-button>
        </div>
      </template>

      <el-table :data="todayTasks" style="width: 100%" :empty-text="emptyText" v-loading="loading">
        <el-table-column prop="knowledge_name" label="知识点">
          <template #default="{ row }">
            {{ row.knowledge_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="subject_name" label="学科" width="120">
          <template #default="{ row }">
            {{ row.subject_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="question_count" label="题目数" width="100">
          <template #default="{ row }">
            {{ row.question_count || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="memory_level" label="记忆水平" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="row.memory_level || 0"
              :color="getMemoryColor(row.memory_level || 0)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="startReviewTask(row)">
              开始复习
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, computed, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { getTodayTasks } from '@/api/modules/review'
import { getOverallStats } from '@/api/modules/analysis'
import { getKnowledgeName, getSubjectNameByKnowledge } from '@/data/questions'

dayjs.locale('zh-cn')

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const currentDate = computed(() => {
  return dayjs().format('YYYY年MM月DD日 dddd')
})

// 统计数据
const stats = reactive({
  studyDays: 1,
  totalQuestions: 0,
  pendingReview: 0,
  accuracy: 0
})

// 今日任务
const todayTasks = ref([])

const emptyText = '🎉 暂无待复习任务，去刷题吧！'

// 计算统计数据
const calculateStats = async () => {
  try {
    console.log('开始计算统计数据...')

    // 清理 localStorage 中的旧模拟数据
    localStorage.removeItem('practiceHistory')
    localStorage.removeItem('reviewRecords')

    // 统计数据初始化为 0
    stats.studyDays = 1
    stats.totalQuestions = 0
    stats.pendingReview = 0
    stats.accuracy = 0

    // 从后端 API 获取整体统计
    const statsResponse = await getOverallStats()
    console.log('统计API响应:', statsResponse)

    if (statsResponse && statsResponse.data) {
      const data = statsResponse.data
      stats.totalQuestions = parseInt(data.totalQuestions) || 0
      const correctCount = parseInt(data.correctQuestions) || 0
      const totalCount = stats.totalQuestions
      stats.accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
      console.log('统计数据:', data, 'totalQuestions:', stats.totalQuestions, 'accuracy:', stats.accuracy)
    }

    console.log('最终统计数据:', stats)
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 加载今日复习任务
const loadTodayTasks = async () => {
  loading.value = true
  try {
    console.log('开始加载今日复习任务...')
    // 尝试从后端 API 获取
    const response = await getTodayTasks()
    console.log('今日任务API响应:', response)
    console.log('今日任务数据类型:', typeof response)
    console.log('今日任务数据:', response.data)

    if (response && response.code === 200) {
      todayTasks.value = response.data || []
      stats.pendingReview = todayTasks.value.length
      console.log('今日任务列表:', todayTasks.value)
    } else {
      console.error('获取今日任务失败:', response)
      todayTasks.value = []
      stats.pendingReview = 0
    }
  } catch (error) {
    console.error('获取今日复习任务失败:', error)
    console.warn('无法从后端获取复习任务，使用本地数据')
    // 如果 API 调用失败，使用本地数据
    const reviewRecords = JSON.parse(localStorage.getItem('reviewRecords') || '[]')
    const now = new Date()
    const tasks = reviewRecords.map(record => ({
      ...record,
      knowledge_name: getKnowledgeName(record.knowledgeId) || '未知知识点',
      subject_name: getSubjectNameByKnowledge(record.knowledgeId) || '未知学科',
      question_count: 1
    }))

    todayTasks.value = tasks.filter(t => {
      const nextTime = new Date(t.nextReviewTime)
      return nextTime <= now && nextTime >= new Date(now - 24 * 60 * 60 * 1000)
    })
  } finally {
    loading.value = false
  }
}

// 获取记忆水平颜色
const getMemoryColor = (level) => {
  if (level >= 70) return '#67C23A'
  if (level >= 40) return '#E6A23C'
  return '#F56C6C'
}

// 开始复习任务
const startReviewTask = (row) => {
  localStorage.setItem('currentReviewTasks', JSON.stringify([row]))
  router.push('/review/doing')
}

// 刷新数据
const refreshData = async () => {
  console.log('刷新仪表板数据...', new Date().toISOString())
  await loadTodayTasks()
  await calculateStats()
}

onMounted(async () => {
  console.log('仪表板组件已挂载')
  await refreshData()
})

// 监听路由变化，当导航到仪表板时刷新数据
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    console.log('路由变化:', oldPath, '->', newPath)
    if (newPath.startsWith('/dashboard')) {
      console.log('导航到仪表板，刷新数据')
      refreshData()
    }
  }
)

// 监听页面可见性变化，当页面重新获得焦点时刷新数据
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && route.path === '/dashboard') {
    console.log('页面重新可见，刷新数据')
    refreshData()
  }
})
</script>

<style lang="scss" scoped>
.dashboard {
  .welcome-section {
    margin-bottom: 24px;

    .welcome-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    h1 {
      font-size: 24px;
      color: #333;
      margin-bottom: 8px;
    }

    .date {
      color: #999;
    }
  }

  .stat-row {
    margin-bottom: 24px;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;

        .stat-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: white;

          &.primary { background: linear-gradient(135deg, #667eea, #764ba2); }
          &.success { background: linear-gradient(135deg, #43e97b, #38f9d7); }
          &.warning { background: linear-gradient(135deg, #f6d365, #fda085); }
          &.danger { background: linear-gradient(135deg, #fa709a, #fee140); }
        }

        .stat-info {
          margin-left: 16px;

          .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #333;
          }

          .stat-label {
            font-size: 14px;
            color: #999;
          }
        }
      }
    }
  }

  .quick-row {
    margin-bottom: 24px;

    .quick-card {
      text-align: center;
      padding: 24px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-4px);
      }

      .quick-icon {
        color: #409EFF;
        margin-bottom: 16px;
      }

      h3 {
        margin-bottom: 8px;
        color: #333;
      }

      p {
        color: #999;
        font-size: 14px;
      }
    }
  }

  .task-card {
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
}
</style>
