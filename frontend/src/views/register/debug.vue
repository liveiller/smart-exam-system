<template>
  <div class="debug-register">
    <el-card>
      <h2>调试注册页面</h2>

      <el-form ref="debugFormRef" :model="debugForm" label-width="120px">
        <el-form-item label="用户名">
          <el-input v-model="debugForm.username" placeholder="3-20个字符，字母数字下划线" />
        </el-form-item>

        <el-form-item label="昵称">
          <el-input v-model="debugForm.nickname" placeholder="可选" />
        </el-form-item>

        <el-form-item label="密码">
          <el-input v-model="debugForm.password" type="password" show-password />
        </el-form-item>

        <el-form-item label="确认密码">
          <el-input v-model="debugForm.confirmPassword" type="password" show-password />
        </el-form-item>

        <el-form-item label="测试方式">
          <el-radio-group v-model="testMethod">
            <el-radio value="mock">模拟测试（不调用API）</el-radio>
            <el-radio value="api">真实API调用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="testRegister" :loading="loading">
            {{ loading ? '测试中...' : '测试注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <el-divider>调试信息</el-divider>

      <el-collapse>
        <el-collapse-item title="表单数据" name="1">
          <pre>{{ JSON.stringify(debugForm, null, 2) }}</pre>
        </el-collapse-item>

        <el-collapse-item title="表单验证规则" name="2">
          <pre>{{ JSON.stringify(rules, null, 2) }}</pre>
        </el-collapse-item>

        <el-collapse-item title="控制台日志" name="3">
          <div id="console-output" style="background: #f5f5f5; padding: 10px; height: 200px; overflow-y: auto; font-size: 12px;">
            <p>点击测试后，日志会显示在这里...</p>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { register } from '@/api'

const debugFormRef = ref()
const loading = ref(false)
const testMethod = ref('mock')

const debugForm = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  nickname: [
    { max: 20, message: '昵称不能超过20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else if (value !== debugForm.password) {
        callback(new Error('两次输入密码不一致'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
}

const log = (message, type = 'info') => {
  const consoleDiv = document.getElementById('console-output')
  const time = new Date().toLocaleTimeString()
  const color = type === 'error' ? 'red' : type === 'success' ? 'green' : 'black'
  const line = document.createElement('p')
  line.innerHTML = `<span style="color: #666">[${time}]</span> <span style="color: ${color}">${message}</span>`
  consoleDiv.appendChild(line)
  consoleDiv.scrollTop = consoleDiv.scrollHeight
}

const testRegister = async () => {
  const valid = await debugFormRef.value.validate().catch(() => false)
  log('表单验证结果: ' + (valid ? '成功' : '失败'), valid ? 'success' : 'error')

  if (!valid) return

  loading.value = true
  log('开始测试注册...')

  if (testMethod.value === 'mock') {
    log('使用模拟测试模式', 'info')
    setTimeout(() => {
      log('✅ 模拟注册成功！', 'success')
      log('前端表单验证: 通过', 'success')
      log('模拟API调用: 不实际发送请求', 'info')
      loading.value = false
    }, 500)
  } else {
    log('使用真实API调用模式', 'info')
    log('请检查浏览器控制台查看详细信息', 'warning')

    try {
      const { confirmPassword, ...data } = debugForm
      log('发送的数据: ' + JSON.stringify(data), 'info')

      const res = await register(data)
      log('API响应: ' + JSON.stringify(res), 'success')
      log('✅ 注册成功！', 'success')
    } catch (error) {
      log('❌ 注册失败: ' + (error.message || error.response?.data?.message || '未知错误'), 'error')
      log('错误详情: ' + JSON.stringify(error.response?.data || error.message, null, 2), 'error')
    } finally {
      loading.value = false
    }
  }
}
</script>

<style scoped>
.debug-register {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  white-space: pre-wrap;
}
</style>
