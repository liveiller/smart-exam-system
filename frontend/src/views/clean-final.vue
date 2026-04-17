<template>
  <div class="clean-final-page">
    <el-card class="header-card">
      <h1>🧹 终极数据清理工具</h1>
      <p>清除所有前端缓存数据</p>
      <el-alert type="warning" :closable="false" show-icon>
        <p>此工具将清除浏览器中的所有 localStorage 数据，包括：</p>
        <p>• 练习历史数据</p>
        <p>• 错题本数据</p>
        <p>• 复习记录数据</p>
        <p>• 用户登录信息</p>
      </el-alert>
    </el-card>

    <el-card class="action-card">
      <h2>选择要清理的数据</h2>
      <el-form label-width="150px">
        <el-form-item label="清理方式">
          <el-radio-group v-model="cleanMethod">
            <el-radio value="all">清空所有数据</el-radio>
            <el-radio value="practice">只清空练习数据</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="具体清理项">
          <el-checkbox-group v-model="itemsToClear">
            <el-checkbox label="practiceHistory">练习历史</el-checkbox>
            <el-checkbox label="notebook">错题本</el-checkbox>
            <el-checkbox label="reviewRecords">复习记录</el-checkbox>
            <el-checkbox label="token">登录令牌</el-checkbox>
            <el-checkbox label="userInfo">用户信息</el-checkbox>
            <el-checkbox label="currentPractice">当前练习</el-checkbox>
            <el-checkbox label="currentReviewTasks">当前复习任务</el-checkbox>
            <el-checkbox label="reviewContinuous">连续复习</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="executeClean" :loading="cleaning" :disabled="!hasItems">
            {{ cleaning ? '清理中...' : '开始清理' }}
          </el-button>
          <el-button @click="executeClearAll" type="danger">一键清空所有</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="preview-card">
      <h2>当前 localStorage 内容</h2>
      <div id="storage-preview" class="storage-preview">
        <el-empty description="点击'开始清理'按钮查看内容" />
      </div>
    </el-card>

    <el-card class="result-card">
      <h2>清理结果</h2>
      <div id="result-preview" class="result-preview">
        <el-empty description="等待清理..." />
      </div>
    </el-card>

    <el-card class="database-card" v-if="dbConnected">
      <template #header>
        <span>💾 数据库状态</span>
      </template>
      <div id="db-status" class="db-status"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const cleanMethod = ref('all')
const itemsToClear = ref([
  'practiceHistory',
  'notebook',
  'reviewRecords',
  'token',
  'userInfo',
  'currentPractice',
  'currentReviewTasks',
  'reviewContinuous'
])
const cleaning = ref(false)
const dbConnected = ref(false)

const hasItems = computed(() => itemsToClear.value.length > 0)

const updateStoragePreview = () => {
  const container = document.getElementById('storage-preview')
  if (!container) return

  const keys = Object.keys(localStorage)
  if (keys.length === 0) {
    container.innerHTML = '<div style="color: #67C23A; padding: 20px; text-align: center;">✅ localStorage 是空的</div>'
  } else {
    let html = '<div class="storage-list">'
    keys.forEach(key => {
      const value = localStorage.getItem(key)
      const size = new Blob([value || '']).size
      const sizeMB = (size / 1024 / 1024).toFixed(4)
      html += `
        <div class="storage-item">
          <div class="item-header">
            <span class="item-name">🔑 ${key}</span>
            <span class="item-size">${sizeMB} MB</span>
          </div>
          <div class="item-value">${value ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : '(空)'}</div>
        </div>
      `
    })
    html += '</div>'
    container.innerHTML = html
  }
}

const updateDbStatus = async () => {
  const container = document.getElementById('db-status')
  if (!container) return

  try {
    const response = await fetch('/api/database/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.code === 200 && data.data.length > 0) {
        const users = data.data.map(u => u.user.username).join(', ')
        const totalRecords = data.data.reduce((sum, u) => {
          return sum + (u.stats.practice_count + u.stats.review_count + u.stats.notebook_count)
        }, 0)

        container.innerHTML = `
          <div style="color: #E6A23C; padding: 15px; background: #fdf6ec; border-left: 3px solid #E6A23C;">
            <p><strong>当前有 ${data.data.length} 个用户在数据库中：</strong></p>
            <p style="color: #666; margin-bottom: 8px;">用户: ${users}</p>
            <p><strong>总记录数: ${totalRecords}</strong></p>
          </div>
        `
        dbConnected.value = true
      } else {
        container.innerHTML = '<div style="color: #67C23A; padding: 20px;">✅ 数据库中无用户数据</div>'
        dbConnected.value = false
      }
    } else {
      container.innerHTML = '<div style="color: #F56C6C; padding: 20px;">❌ 无法连接数据库</div>'
      dbConnected.value = false
    }
  } catch (error) {
    console.error('获取数据库状态失败:', error)
    container.innerHTML = '<div style="color: #F56C6C; padding: 20px;">❌ 无法连接数据库</div>'
    dbConnected.value = false
  }
}

const executeClean = () => {
  if (itemsToClear.value.length === 0) {
    alert('请至少选择一项要清理的内容')
    return
  }

  cleaning.value = true
  const resultDiv = document.getElementById('result-preview')
  resultDiv.innerHTML = '<p style="color: #409EFF;">正在清理 localStorage 数据...</p>'

  setTimeout(() => {
    let cleared = 0

    itemsToClear.value.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        cleared++
      }
    })

    updateStoragePreview()

    const html = `
      <div style="color: #67C23A; margin-bottom: 10px;">✅ 清理完成！</div>
      <div><strong>已清理 ${cleared} 项数据</strong></div>
      <div style="color: #999; font-size: 12px; margin-top: 10px;">请刷新页面使更改生效</div>
    `
    resultDiv.innerHTML = html

    // 清理后尝试获取数据库状态
    updateDbStatus()

    cleaning.value = false
  }, 500)
}

const executeClearAll = () => {
  if (confirm('确定要清空所有 localStorage 数据吗？此操作不可恢复！')) {
    localStorage.clear()
    updateStoragePreview()

    const resultDiv = document.getElementById('result-preview')
    resultDiv.innerHTML = `
      <div style="color: #67C23A; margin-bottom: 10px;">✅ 所有数据已清空！</div>
      <div><strong>页面将自动刷新...</strong></div>
    `

    setTimeout(() => {
      location.reload()
    }, 1000)
  }
}

onMounted(() => {
  updateStoragePreview()
  updateDbStatus()

  // 每10秒更新一次数据库状态
  setInterval(updateDbStatus, 10000)
})
</script>

<style scoped>
.clean-final-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.header-card,
.action-card,
.preview-card,
.result-card,
.database-card {
  margin-bottom: 20px;
}

.header-card {
  text-align: center;
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  h1 { margin-bottom: 10px; }
  p { opacity: 0.9; }
}

.action-card,
.preview-card,
.result-card,
.database-card {
  h2 {
    margin-bottom: 16px;
    color: #333;
  }
}

.storage-preview,
.result-preview,
.db-status {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
}

.storage-preview .storage-list,
.storage-preview .storage-item {
  border-bottom: 1px solid #eee;
  padding: 8px 0;
}

.storage-preview .storage-item:last-child {
  border-bottom: none;
}

.storage-preview .item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.storage-preview .item-name {
  font-weight: 500;
  color: #333;
}

.storage-preview .item-size {
  color: #999;
  font-size: 12px;
}

.storage-preview .item-value {
  color: #666;
  font-size: 12px;
  font-family: monospace;
  word-break: break-all;
}

.database-card {
  background: #f0f9ff;
  border: 1px solid #b3d8ff;
}
</style>
