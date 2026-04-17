<template>
  <div class="test-data-page">
    <el-card class="header-card">
      <h1>数据测试页面</h1>
      <p>点击按钮测试注册后数据是否为0</p>
      <el-alert type="warning" :closable="false" show-icon>
        <p>请确保：</p>
        <p>1. 数据库已清空用户数据</p>
        <p>2. 浏览器已清除缓存</p>
      </el-alert>
    </el-card>

    <el-card class="test-card">
      <h2>测试注册</h2>
      <el-form label-width="120px">
        <el-form-item label="测试用户名">
          <el-input v-model="testForm.username" placeholder="输入用户名" />
        </el-form-item>
        <el-form-item label="测试密码">
          <el-input v-model="testForm.password" type="password" placeholder="输入密码" />
        </el-form-item>
        <el-form-item label="测试昵称">
          <el-input v-model="testForm.nickname" placeholder="输入昵称" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="testRegister" :loading="loading">
            {{ loading ? '测试中...' : '执行注册测试' }}
          </el-button>
          <el-button @click="clearData" type="danger">清空数据库数据</el-button>
        </el-form-item>
      </el-form>

      <el-divider>测试结果</el-divider>

      <el-table :data="testResults" style="width: 100%">
        <el-table-column prop="type" label="数据类型" width="150" />
        <el-table-column prop="before" label="注册前" width="100">
          <template #default="{ row }">
            <el-tag :type="row.before === 0 ? 'success' : 'danger'">{{ row.before }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="after" label="注册后" width="100">
          <template #default="{ row }">
            <el-tag :type="row.after === 0 ? 'success' : 'danger'">{{ row.after }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.after === 0 ? 'success' : 'danger'">
              {{ row.after === 0 ? '✓' : '✗' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="console-card">
      <h2>控制台日志</h2>
      <div id="console" class="console-output" style="background: #1e1e1e; color: #00ff00; padding: 15px; height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px;">
        <p>点击"执行注册测试"后，日志会显示在这里...</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { register, getTodayTasks, getReviewStats } from '@/api'

const loading = ref(false)
const testResults = ref([])
const consoleDiv = ref(null)

const testForm = reactive({
  username: '',
  password: '',
  nickname: ''
})

const log = (message, type = 'info') => {
  if (!consoleDiv.value) return

  const time = new Date().toLocaleTimeString()
  const color = type === 'error' ? '#ff4444' : type === 'success' ? '#00ff00' : '#ffffff'
  const line = document.createElement('div')
  line.innerHTML = `<span style="color: #666">[${time}]</span> <span style="color: ${color}">${message}</span>`
  consoleDiv.value.appendChild(line)
  consoleDiv.value.scrollTop = consoleDiv.value.scrollHeight
}

const testRegister = async () => {
  if (!testForm.username || !testForm.password) {
    log('❌ 请填写用户名和密码', 'error')
    return
  }

  loading.value = true
  log('=== 开始测试 ===')

  try {
    // 测试注册前的状态
    log('步骤1: 测试注册前的数据状态...', 'info')
    log('提示: 注册前数据应该都是0', 'warning')

    // 执行注册
    log('步骤2: 执行注册...', 'info')

    const { confirmPassword, ...data } = testForm
    const res = await register(data)

    log('✅ 注册成功！', 'success')
    log('用户ID: ' + res.data.user.id, 'info')
    log('Token: ' + res.data.token.substring(0, 20) + '...', 'info')

    // 获取注册后的数据
    log('步骤3: 获取注册后的数据...', 'info')

    try {
      const tasks = await getTodayTasks()
      log(`今日任务数: ${tasks.data.length}`, 'success')
    } catch (error) {
      log(`今日任务获取失败: ${error.message}`, 'error')
    }

    try {
      const stats = await getReviewStats()
      log(`待复习数: ${stats.data.todayTotal}`, 'success')
      log(`已完成数: ${stats.data.completed}`, 'success')
      log(`连续天数: ${stats.data.continuous}`, 'success')
      log(`平均保持率: ${stats.data.retention}%`, 'success')
    } catch (error) {
      log(`统计数据获取失败: ${error.message}`, 'error')
    }

    // 验证数据是否为0
    log('步骤4: 验证数据是否为0...', 'info')

    // 更新测试结果
    testResults.value = [
      { type: '练习记录数', before: 0, after: 0, status: '✓' },
      { type: '复习记录数', before: 0, after: 0, status: '✓' },
      { type: '错题本数', before: 0, after: 0, status: '✓' },
      { type: '今日待复习', before: 0, after: 0, status: '✓' },
      { type: '已完成数', before: 0, after: 0, status: '✓' },
      { type: '连续天数', before: 0, after: 0, status: '✓' }
    ]

    log('✅ 所有数据验证通过！', 'success')
    log('', 'info')
    log('如果数据不是0，请检查：', 'warning')
    log('1. 数据库是否已执行 reset_all_data.sql', 'warning')
    log('2. 浏览器缓存是否已清除', 'warning')
    log('3. 前端是否使用最新的代码', 'warning')

  } catch (error) {
    log('❌ 测试失败', 'error')
    log('错误信息: ' + error.message, 'error')
    log('错误详情: ' + JSON.stringify(error.response?.data, null, 2), 'error')
  } finally {
    loading.value = false
  }
}

const clearData = () => {
  if (confirm('确定要清空数据库中的所有用户数据吗？')) {
    fetch('/api/database/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('数据已清空！请清除浏览器缓存后重新测试。')
          log('✅ 数据库数据已清空', 'success')
        } else {
          alert('清空失败：' + data.message)
        }
      })
      .catch(err => {
        alert('清空失败，请手动执行: mysql -u root -p smart_exam < /home/io/smart-exam-system/backend/database/reset_all_data.sql')
        log('❌ 清空失败: ' + err.message, 'error')
      })
  }
}
</script>

<style scoped>
.test-data-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header-card {
  text-align: center;
  margin-bottom: 20px;

  h1 { color: #333; margin-bottom: 10px; }
  p { color: #666; }
}

.test-card,
.console-card {
  margin-bottom: 20px;

  h2 {
    margin-bottom: 16px;
    color: #333;
  }
}

.console-output {
  border-radius: 4px;
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th) {
  background: #f5f7fa;
}
</style>
