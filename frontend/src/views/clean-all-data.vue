<template>
  <div class="clean-data-page">
    <el-card class="header-card">
      <h1>🧹 清理所有数据</h1>
      <p>点击下方按钮清除浏览器中的所有缓存数据</p>
    </el-card>

    <el-card class="action-card">
      <h2>操作选项</h2>
      <el-form label-width="150px">
        <el-form-item label="清除方式">
          <el-radio-group v-model="cleanMethod">
            <el-radio value="all">清空所有数据</el-radio>
            <el-radio value="specific">只清理本项目数据</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="清除范围">
          <el-checkbox-group v-model="itemsToClear">
            <el-checkbox label="practiceHistory">练习历史</el-checkbox>
            <el-checkbox label="notebook">错题本</el-checkbox>
            <el-checkbox label="reviewRecords">复习记录</el-checkbox>
            <el-checkbox label="token">登录令牌</el-checkbox>
            <el-checkbox label="userInfo">用户信息</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="executeClean" :loading="cleaning" :disabled="!hasItems">
            {{ cleaning ? '清理中...' : '开始清理' }}
          </el-button>
          <el-button @click="executeClearAll">一键清空所有</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="preview-card">
      <h2>当前 localStorage 内容</h2>
      <div id="storage-content" class="storage-content">
        点击"开始清理"按钮查看
      </div>
    </el-card>

    <el-card class="result-card">
      <h2>清理结果</h2>
      <div id="result-content" class="result-content"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const cleanMethod = ref('all')
const itemsToClear = ref(['practiceHistory', 'notebook', 'reviewRecords', 'token', 'userInfo'])
const cleaning = ref(false)

const hasItems = computed(() => itemsToClear.value.length > 0)

const updateStoragePreview = () => {
  const container = document.getElementById('storage-content')
  if (!container) return

  const keys = Object.keys(localStorage)
  if (keys.length === 0) {
    container.innerHTML = '<p style="color: #67C23A">✅ localStorage 是空的</p>'
  } else {
    let html = '<table style="width: 100%; border-collapse: collapse;">'
    html += '<tr style="background: #f5f5f5;"><th style="padding: 8px; text-align: left;">Key</th><th style="padding: 8px; text-align: left;">Value (前50字符)</th></tr>'

    keys.forEach(key => {
      const value = localStorage.getItem(key)
      const preview = value ? value.substring(0, 50) + (value.length > 50 ? '...' : '') : ''
      html += `<tr>
        <td style="padding: 6px; border-bottom: 1px solid #eee;">${key}</td>
        <td style="padding: 6px; border-bottom: 1px solid #eee; color: #666;">${preview}</td>
      </tr>`
    })

    html += '</table>'
    container.innerHTML = html
  }
}

const executeClean = () => {
  if (itemsToClear.value.length === 0) {
    alert('请至少选择一项要清理的内容')
    return
  }

  cleaning.value = true
  const resultDiv = document.getElementById('result-content')
  resultDiv.innerHTML = '<p>正在清理...</p>'

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
      <p style="color: #67C23A">✅ 清理完成！</p>
      <p>已清理 ${cleared} 项数据</p>
      <p style="color: #999; font-size: 12px;">请刷新页面使更改生效</p>
    `
    resultDiv.innerHTML = html

    cleaning.value = false
  }, 500)
}

const executeClearAll = () => {
  if (confirm('确定要清空所有 localStorage 数据吗？此操作不可恢复！')) {
    localStorage.clear()
    updateStoragePreview()

    const resultDiv = document.getElementById('result-content')
    resultDiv.innerHTML = `
      <p style="color: #67C23A">✅ 所有数据已清空！</p>
      <p>页面将自动刷新...</p>
    `

    setTimeout(() => {
      location.reload()
    }, 1000)
  }
}

onMounted(() => {
  updateStoragePreview()
})
</script>

<style scoped>
.clean-data-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.header-card,
.action-card,
.preview-card,
.result-card {
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
.result-card {
  h2 {
    margin-bottom: 16px;
    color: #333;
  }
}

.storage-content {
  background: #1e1e1e;
  color: #00ff00;
  padding: 15px;
  border-radius: 4px;
  height: 300px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
}

.result-content {
  min-height: 50px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

:deep(.el-checkbox) {
  margin-right: 15px;
  margin-bottom: 8px;
}
</style>
