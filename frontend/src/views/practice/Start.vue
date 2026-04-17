<template>
  <div class="practice-start">
    <el-card class="setup-card">
      <template #header>
        <div class="card-header">
          <span>📝 开始刷题</span>
        </div>
      </template>
      
      <el-form :model="practiceForm" label-width="100px">
        <!-- 选择学科 -->
        <el-form-item label="选择学科">
          <el-select
            v-model="practiceForm.subjectId"
            placeholder="请选择学科"
            @change="handleSubjectChange"
            style="width: 100%"
          >
            <el-option
              v-for="item in subjects"
              :key="item.id"
              :label="`${item.icon} ${item.name}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <!-- 选择章节 -->
        <el-form-item label="选择章节">
          <el-select
            v-model="practiceForm.chapterId"
            placeholder="请选择章节"
            @change="handleChapterChange"
            style="width: 100%"
            :disabled="!practiceForm.subjectId"
          >
            <el-option
              v-for="item in currentChapters"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <!-- 选择知识点 -->
        <el-form-item label="选择知识点">
          <el-select
            v-model="practiceForm.knowledgeId"
            placeholder="请选择知识点"
            @change="handleKnowledgeChange"
            style="width: 100%"
            :disabled="!practiceForm.chapterId"
          >
            <el-option
              v-for="item in currentKnowledgePoints"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <!-- 题目数量 -->
        <el-form-item label="题目数量">
          <el-slider
            v-model="practiceForm.questionCount"
            :min="1"
            :max="10"
            :step="1"
            show-stops
          />
          <span style="margin-left: 16px">{{ practiceForm.questionCount }} 题</span>
        </el-form-item>
        
        <!-- 难度选择 -->
        <el-form-item label="题目难度">
          <el-radio-group v-model="practiceForm.difficulty">
            <el-radio-button :value="0">全部</el-radio-button>
            <el-radio-button :value="1">简单</el-radio-button>
            <el-radio-button :value="2">中等</el-radio-button>
            <el-radio-button :value="3">困难</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <!-- 开始按钮 -->
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            @click="startPractice"
            :disabled="!practiceForm.knowledgeId"
            style="width: 200px"
          >
            开始刷题
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 最近练习记录 -->
    <el-card class="history-card">
      <template #header>
        <span>📋 最近练习</span>
      </template>
      
      <el-table :data="recentPractices" style="width: 100%">
        <el-table-column prop="subject_name" label="学科" width="120" />
        <el-table-column prop="knowledge_name" label="知识点" />
        <el-table-column prop="question_count" label="题目数" width="100" />
        <el-table-column prop="correct_count" label="正确" width="80" />
        <el-table-column prop="accuracy" label="正确率" width="100">
          <template #default="{ row }">
            <span :style="{ color: parseFloat(row.accuracy) >= 60 ? '#67C23A' : '#F56C6C' }">
              {{ parseFloat(row.accuracy).toFixed(0) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="practice_date" label="时间" width="160">
          <template #default="{ row }">
            {{ new Date(row.practice_date).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="continuePractice(row)">
              继续练习
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

const practiceForm = reactive({
  subjectId: null,
  chapterId: null,
  knowledgeId: null,
  questionCount: 10,
  difficulty: 0
})

// 加载学科列表
const subjects = ref([])
// 当前章节列表
const currentChapters = ref([])
// 当前知识点列表
const currentKnowledgePoints = ref([])

// 加载数据
const loadSubjects = async () => {
  try {
    const response = await request.get('/questions/subjects')
    subjects.value = response.data || []
  } catch (error) {
    console.error('加载学科列表失败:', error)
  }
}

// 加载章节列表
const loadChapters = async (subjectId) => {
  if (!subjectId) {
    currentChapters.value = []
    currentKnowledgePoints.value = []
    return
  }
  try {
    const response = await request.get('/questions/chapters', { params: { subjectId } })
    console.log('章节数据:', response)
    currentChapters.value = response.data || []
  } catch (error) {
    console.error('加载章节列表失败:', error)
  }
}

// 加载知识点列表
const loadKnowledgePoints = async (chapterId) => {
  if (!chapterId) {
    currentKnowledgePoints.value = []
    return
  }
  try {
    const response = await request.get('/questions/knowledge', { params: { chapterId } })
    console.log('知识点数据:', response)
    currentKnowledgePoints.value = response.data || []
  } catch (error) {
    console.error('加载知识点列表失败:', error)
  }
}

// 最近练习记录
const recentPractices = ref([])

// 学科变更
const handleSubjectChange = async () => {
  practiceForm.chapterId = null
  practiceForm.knowledgeId = null
  currentChapters.value = []
  currentKnowledgePoints.value = []
  await loadChapters(practiceForm.subjectId)
}

// 章节变更
const handleChapterChange = async () => {
  practiceForm.knowledgeId = null
  currentKnowledgePoints.value = []
  await loadKnowledgePoints(practiceForm.chapterId)
}

// 知识点变更
const handleKnowledgeChange = async () => {
  // 知识点选择后，启用开始按钮
}

onMounted(async () => {
  await loadSubjects()
  await loadRecentPractices()
})

// 加载历史记录
const loadRecentPractices = async () => {
  try {
    console.log('加载练习历史...')
    const response = await request.get('/questions/history?limit=5')
    console.log('练习历史响应:', response)

    if (response.code === 200 && response.data && response.data.length > 0) {
      recentPractices.value = response.data
      console.log('最近练习记录:', response.data)
    } else {
      recentPractices.value = []
    }
  } catch (error) {
    console.error('获取练习历史失败:', error)
    recentPractices.value = []
  }
}
const startPractice = () => {
  console.log('开始刷题被调用，当前配置:', practiceForm)
  console.log('知识点ID:', practiceForm.knowledgeId)

  // 检查是否选择了知识点
  if (!practiceForm.knowledgeId) {
    console.log('知识点ID为空')
    ElMessage.warning('请先选择知识点')
    return
  }

  console.log('开始刷题，配置:', practiceForm)

  // 保存练习配置
  const practiceConfig = {
    ...practiceForm,
    timestamp: Date.now()
  }
  localStorage.setItem('currentPractice', JSON.stringify(practiceConfig))
  console.log('已保存配置到 localStorage:', practiceConfig)

  // 跳转到答题页面
  console.log('准备跳转到 /practice/doing')
  router.push('/practice/doing')
}

// 继续练习
const continuePractice = (row) => {
  practiceForm.subjectId = subjects.value.find(s => s.name === row.subject_name)?.id
  practiceForm.knowledgeId = row.knowledge_id
  startPractice()
}

</script>

<style lang="scss" scoped>
.practice-start {
  .setup-card {
    max-width: 600px;
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      align-items: center;
    }
  }
}
</style>