<template>
  <div class="review-doing">
    <el-card class="header-card">
      <div class="header-info">
        <h3>📝 复习答题</h3>
        <p>知识点：{{ currentTask?.knowledgeName }} | 第 {{ currentTask?.reviewStage }} 次复习</p>
      </div>
      
      <div class="progress-info">
        <span>进度：{{ currentIndex + 1 }} / {{ totalQuestions }}</span>
        <el-progress :percentage="progressPercent" :stroke-width="8" />
      </div>
    </el-card>
    
    <!-- 题目卡片 -->
    <el-card class="question-card" v-if="currentQuestion">
      <div class="question-header">
        <el-tag :type="currentQuestion.type === 1 ? 'primary' : 'success'">
          {{ currentQuestion.type === 1 ? '单选题' : '多选题' }}
        </el-tag>
      </div>
      
      <h3>{{ currentQuestion.content }}</h3>
      
      <div class="options">
        <el-radio-group v-model="selectedAnswer" v-if="currentQuestion.type === 1">
          <el-radio v-for="(opt, key) in currentQuestion.options" :key="key" :value="key" class="option-item">
            {{ key }}. {{ opt }}
          </el-radio>
        </el-radio-group>
        
        <el-checkbox-group v-model="selectedAnswers" v-else>
          <el-checkbox v-for="(opt, key) in currentQuestion.options" :key="key" :label="key" class="option-item">
            {{ key }}. {{ opt }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      
      <!-- 结果展示 -->
      <div v-if="showResult" class="result-area">
        <el-alert 
          :type="isCorrect ? 'success' : 'error'"
          :title="isCorrect ? '✓ 回答正确！' : '✗ 回答错误'"
        >
          <p v-if="!isCorrect">正确答案：{{ currentQuestion.answer }}</p>
          <p><strong>解析：</strong>{{ currentQuestion.analysis }}</p>
        </el-alert>
      </div>
      
      <div class="actions">
        <el-button v-if="!showResult" type="primary" size="large" @click="submitAnswer">
          提交答案
        </el-button>
        
        <template v-else>
          <el-button v-if="currentIndex < totalQuestions - 1" type="primary" size="large" @click="nextQuestion">
            下一题
          </el-button>
          <el-button v-else type="success" size="large" @click="finishReview">
            完成复习
          </el-button>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { questionBank } from '@/data/questions'
import { updateReviewRecord, updateContinuousDays } from '@/utils/ebbinghaus'
import { request } from '@/api/index'

const router = useRouter()

const currentTask = ref(null)
const questions = ref([])
const currentIndex = ref(0)
const selectedAnswer = ref('')
const selectedAnswers = ref([])
const showResult = ref(false)
const reviewResults = ref([])

const totalQuestions = computed(() => questions.value.length)
const currentQuestion = computed(() => questions.value[currentIndex.value])
const progressPercent = computed(() => {
  if (totalQuestions.value === 0) return 0
  return Math.round(((currentIndex.value + 1) / totalQuestions.value) * 100)
})
const isCorrect = computed(() => {
  const q = currentQuestion.value
  if (!q) return false
  const userAnswer = q.type === 1 ? selectedAnswer.value : selectedAnswers.value.sort().join('')
  return userAnswer === q.answer
})

// 加载复习题目
const loadReviewQuestions = async () => {
  try {
    // 从后端获取今日任务
    const tasksData = await request.get('/review/tasks')

    if (tasksData.code !== 200 || tasksData.data.length === 0) {
      ElMessage.warning('暂无复习任务')
      router.push('/review')
      return
    }

    // 获取所有今日复习任务
    const tasks = tasksData.data
    currentTask.value = tasks[0]

    // 根据知识点获取题目
    const knowledgeId = currentTask.value.knowledgeId
    const allQuestions = questionBank.filter(q => q.knowledgeId === knowledgeId)

    // 随机选择题目
    const count = Math.min(currentTask.value.questionCount || 5, allQuestions.length)
    questions.value = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, count)
  } catch (error) {
    console.error('加载复习题目失败:', error)
    ElMessage.error('加载复习题目失败')
    router.push('/review')
  }
}

// 提交答案
const submitAnswer = () => {
  const q = currentQuestion.value
  const userAnswer = q.type === 1 ? selectedAnswer.value : selectedAnswers.value.sort().join('')
  const correct = userAnswer === q.answer

  reviewResults.value.push({
    questionId: q.id,
    isCorrect: correct
  })

  showResult.value = true
}

// 下一题
const nextQuestion = () => {
  currentIndex.value++
  selectedAnswer.value = ''
  selectedAnswers.value = []
  showResult.value = false
}

// 完成复习
const finishReview = async () => {
  // 更新复习记录
  const correctCount = reviewResults.value.filter(r => r.isCorrect).length
  const totalCount = reviewResults.value.length
  const overallCorrect = correctCount >= totalCount / 2

  // 调用后端 API 更新复习记录
  try {
    const data = await request.post('/review/submit', {
      results: reviewResults.value.map(r => ({
        questionId: r.questionId,
        isCorrect: r.isCorrect
      }))
    })

    if (data.code === 200) {
      ElMessage.success(`复习完成！答对 ${correctCount}/${totalCount} 题`)
      router.push('/review')
    } else {
      ElMessage.error(data.message || '保存复习结果失败')
    }
  } catch (error) {
    console.error('保存复习结果失败:', error)
    ElMessage.error('保存复习结果失败')
    router.push('/review')
  }
}

onMounted(() => {
  loadReviewQuestions()
})
</script>

<style lang="scss" scoped>
.review-doing {
  max-width: 800px;
  margin: 0 auto;
  
  .header-card {
    margin-bottom: 20px;
    
    .header-info {
      margin-bottom: 20px;
      h3 { margin-bottom: 8px; }
      p { color: #999; }
    }
  }
  
  .question-card {
    h3 { margin: 20px 0; line-height: 1.6; }
    
    .options {
      margin: 30px 0;
      
      .option-item {
        display: block;
        padding: 12px 16px;
        margin-bottom: 12px;
        background: #f5f7fa;
        border-radius: 8px;
      }
    }
    
    .result-area {
      margin: 20px 0;
    }
    
    .actions {
      text-align: center;
      margin-top: 30px;
    }
  }
}
</style>