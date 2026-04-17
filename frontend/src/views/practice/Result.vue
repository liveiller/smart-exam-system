<template>
  <div class="practice-result">
    <el-card class="result-summary">
      <div class="summary-header">
        <h2>🎉 练习完成</h2>
        <p>恭喜你完成了本次练习！</p>
      </div>
      
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ actualCount || total }}</div>
            <div class="stat-label">已完成</div>
            <div class="stat-hint">共选择 {{ total }} 题</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item success">
            <div class="stat-value">{{ correct }}</div>
            <div class="stat-label">答对题数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item" :class="accuracyClass">
            <div class="stat-value">{{ accuracy }}%</div>
            <div class="stat-label">正确率</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-value">{{ formatTime(elapsedTime) }}</div>
            <div class="stat-label">用时</div>
          </div>
        </el-col>
      </el-row>
      
      <!-- 进度环 -->
      <div class="progress-circle">
        <el-progress 
          type="circle" 
          :percentage="accuracy" 
          :color="progressColor"
          :width="160"
          :stroke-width="12"
        />
      </div>
    </el-card>
    
<!-- 错题回顾 -->
<el-card class="wrong-questions">
  <template #header>
    <span>📝 错题回顾（{{ wrongQuestions.length }} 道）</span>
  </template>
  
  <div v-if="wrongQuestions.length === 0" class="no-wrong">
    <el-icon :size="48" color="#67C23A"><CircleCheck /></el-icon>
    <p>太棒了！全部答对！</p>
  </div>
  
  <div v-else>
    <el-collapse v-model="activeNames">
      <el-collapse-item 
        v-for="(q, index) in wrongQuestions" 
        :key="q.id"
        :name="index"
      >
        <template #title>
          <div class="collapse-title">
            <el-tag :type="q.type === 1 ? 'primary' : 'success'" size="small">
              {{ q.type === 1 ? '单选' : '多选' }}
            </el-tag>
            <span class="title-text">{{ index + 1 }}. {{ truncateContent(q.content) }}</span>
          </div>
        </template>
        
        <div class="wrong-detail">
          <div class="user-answer">
            <span class="label">你的答案：</span>
            <span class="value wrong">{{ formatUserAnswer(q) }}</span>
          </div>
          <div class="correct-answer">
            <span class="label">正确答案：</span>
            <span class="value correct">{{ q.answer }}</span>
          </div>
          <div class="analysis">
            <span class="label">解析：</span>
            <p>{{ q.analysis }}</p>
          </div>
           <div class="actions">
            <el-button type="primary" size="small" @click="addToNotebook(q)">
            <el-icon><Notebook /></el-icon>
              加入错题本
              </el-button>
              <el-button size="small" @click="practiceSimilar(q.knowledgeId)">
              <el-icon><RefreshRight /></el-icon>
              练习同类题
            </el-button>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</el-card>
    
    <!-- 答题详情表格 -->
    <el-card class="detail-table">
      <template #header>
        <span>📊 答题详情</span>
      </template>
      
      <el-table :data="allQuestions" style="width: 100%" max-height="400">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="content" label="题目" min-width="200">
          <template #default="{ row }">
            {{ truncateContent(row.content) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结果" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isCorrect ? 'success' : 'danger'" size="small">
              {{ row.isCorrect ? '正确' : '错误' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 操作按钮 -->
    <div class="result-actions">
      <el-button size="large" @click="goBack">返回首页</el-button>
      <el-button type="primary" size="large" @click="practiceAgain">继续刷题</el-button>
      <el-button type="success" size="large" @click="goToReview">去复习</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useNotebookStore } from '@/store/modules/notebook'
import { getSubjectNameByKnowledge, getKnowledgeName } from '@/data/questions'

const notebookStore = useNotebookStore()
const router = useRouter()

// 练习结果
const questions = ref([])
const record = ref({})
const total = ref(0)
const actualCount = ref(0)
const correct = ref(0)
const accuracy = ref(0)
const elapsedTime = ref(0)

const activeNames = ref([0])

// 所有题目
const allQuestions = computed(() => questions.value)

// 错题列表
const wrongQuestions = computed(() => {
  return questions.value.filter(q => !q.isCorrect)
})

// 正确率样式
const accuracyClass = computed(() => {
  if (accuracy.value >= 80) return 'excellent'
  if (accuracy.value >= 60) return 'good'
  return 'poor'
})

// 进度环颜色
const progressColor = computed(() => {
  if (accuracy.value >= 80) return '#67C23A'
  if (accuracy.value >= 60) return '#E6A23C'
  return '#F56C6C'
})

// 截断内容
const truncateContent = (content, length = 40) => {
  if (!content) return ''
  return content.length > length ? content.slice(0, length) + '...' : content
}

// 格式化时间
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}

// 获取类型标签
const getTypeTag = (type) => {
  if (type === 1) return 'primary'
  if (type === 2) return 'success'
  return 'warning'
}

const getTypeText = (type) => {
  if (type === 1) return '单选'
  if (type === 2) return '多选'
  return '判断'
}

// 格式化答案
const formatAnswer = (answer) => {
  if (!answer) return ''
  if (answer === 'true') return '正确'
  if (answer === 'false') return '错误'
  return answer
}

// 格式化用户答案
const formatUserAnswer = (q) => {
  if (!q.userAnswer) return '未作答'
  if (q.type === 3) {
    return q.userAnswer === 'true' ? '正确' : '错误'
  }
  return q.userAnswer
}

// 加入错题本
const addToNotebook = (question) => {
  // 检查是否已存在
  const exists = notebookStore.questions.find(q => q.questionId === question.id)

  if (exists) {
    // 已存在，增加错误次数
    exists.wrongCount = (exists.wrongCount || 1) + 1
    exists.lastWrongTime = new Date().toISOString()
    notebookStore.saveToStorage()
    ElMessage.info('该题已在错题本中，错误次数已更新')
  } else {
    // 新错题，添加到错题本
    const knowledgeId = question.knowledgeId || question.knowledge_id
    notebookStore.addQuestion({
      questionId: question.id,
      type: question.type,
      difficulty: question.difficulty,
      content: question.content,
      options: question.options,
      answer: question.answer,
      analysis: question.analysis,
      userAnswer: question.userAnswer,
      knowledgeId: knowledgeId,
      subjectName: getSubjectNameByKnowledge(knowledgeId),
      knowledgeName: getKnowledgeName(knowledgeId)
    })
    ElMessage.success('已添加到错题本')
  }
}

// 练习同类题
const practiceSimilar = (knowledgeId) => {
  localStorage.setItem('currentPractice', JSON.stringify({
    knowledgeId,
    questionCount: 10,
    difficulty: 0
  }))
  router.push('/practice/doing')
}

// 返回首页
const goBack = () => {
  // 使用时间戳确保触发路由变化
  router.push({ path: '/dashboard', query: { t: Date.now() } })
}

// 继续刷题
const practiceAgain = () => {
  router.push('/practice/start')
}

// 去复习
const goToReview = () => {
  router.push('/review')
}

onMounted(() => {
  // 优先从 localStorage 获取结果
  const savedResult = localStorage.getItem('practiceResult')

  if (savedResult) {
    try {
      const result = JSON.parse(savedResult)
      questions.value = result.questions || []
      record.value = result.record || {}
      total.value = result.total || 0
      actualCount.value = result.actualCount || questions.value.length
      correct.value = result.correct || 0
      accuracy.value = result.accuracy || 0
      elapsedTime.value = result.elapsedTime || 0

      // 确保每个题目都有 knowledgeId 字段
      questions.value.forEach(q => {
        if (!q.knowledgeId && q.knowledge_id) {
          q.knowledgeId = q.knowledge_id
        }
      })

      // 清除已使用的数据
      localStorage.removeItem('practiceResult')
      return
    } catch (e) {
      console.error('解析结果数据失败:', e)
    }
  }
  
  // 尝试从路由状态获取
  const state = history.state
  if (state && state.questions) {
    questions.value = state.questions
    record.value = state.record || {}
    total.value = state.total || state.questions.length
    actualCount.value = state.actualCount || questions.value.length
    correct.value = state.correct || 0
    accuracy.value = state.accuracy || 0
    elapsedTime.value = state.elapsedTime || 0

    // 确保每个题目都有 knowledgeId 字段
    questions.value.forEach(q => {
      if (!q.knowledgeId && q.knowledge_id) {
        q.knowledgeId = q.knowledge_id
      }
    })

    return
  }
  
  // 尝试从 progress 获取（作为最后手段）
  const progress = JSON.parse(localStorage.getItem('practiceProgress') || '{}')
  if (progress.questions) {
    questions.value = progress.questions
    total.value = progress.questions.length
    actualCount.value = questions.value.length
    correct.value = progress.questions.filter(q => q.isCorrect).length
    accuracy.value = total.value > 0 ? Math.round((correct.value / total.value) * 100) : 0
    elapsedTime.value = progress.elapsedTime || 0

    // 确保每个题目都有 knowledgeId 字段
    questions.value.forEach(q => {
      if (!q.knowledgeId && q.knowledge_id) {
        q.knowledgeId = q.knowledge_id
      }
    })
  }
})
</script>

<style lang="scss" scoped>
.practice-result {
  max-width: 900px;
  margin: 0 auto;
  
  .result-summary {
    text-align: center;
    margin-bottom: 20px;
    
    .summary-header {
      margin-bottom: 30px;
      
      h2 {
        color: #333;
        margin-bottom: 10px;
      }
      
      p {
        color: #999;
      }
    }
    
    .stats-row {
      margin-bottom: 30px;
      
      .stat-item {
        .stat-value {
          font-size: 36px;
          font-weight: bold;
          color: #333;
        }

        .stat-label {
          font-size: 14px;
          color: #999;
          margin-top: 5px;
        }

        .stat-hint {
          font-size: 12px;
          color: #999;
          margin-top: 2px;
        }

        &.success .stat-value { color: #67C23A; }
        &.excellent .stat-value { color: #67C23A; }
        &.good .stat-value { color: #E6A23C; }
        &.poor .stat-value { color: #F56C6C; }
      }
    }
    
    .progress-circle {
      margin: 20px 0;
    }
  }
  
  .wrong-questions {
    margin-bottom: 20px;
    
    .no-wrong {
      text-align: center;
      padding: 40px;
      
      p {
        margin-top: 20px;
        color: #666;
        font-size: 16px;
      }
    }
    
    .collapse-title {
      display: flex;
      align-items: center;
      
      .title-text {
        margin-left: 10px;
        font-weight: normal;
      }
    }
    
    .wrong-detail {
      padding: 15px 20px;
      
      .user-answer, .correct-answer {
        margin-bottom: 10px;
        
        .label {
          font-weight: bold;
          margin-right: 10px;
        }
        
        .value.wrong {
          color: #F56C6C;
        }
        
        .value.correct {
          color: #67C23A;
        }
      }
      
      .analysis {
        margin: 15px 0;
        padding: 15px;
        background: #f5f7fa;
        border-radius: 8px;
        
        .label {
          font-weight: bold;
          display: block;
          margin-bottom: 8px;
        }
        
        p {
          color: #666;
          line-height: 1.6;
        }
      }
      
      .actions {
        margin-top: 15px;
        display: flex;
        gap: 10px;
      }
    }
  }
  
  .detail-table {
    margin-bottom: 20px;
  }
  
  .result-actions {
    margin-top: 30px;
    text-align: center;
    
    .el-button {
      min-width: 120px;
      margin: 0 10px;
    }
  }
}
</style>