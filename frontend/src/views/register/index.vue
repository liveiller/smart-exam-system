<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <h2>注册账号</h2>
        <p class="subtitle">加入考研智能刷题系统，开启高效学习之旅</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="rules"
        class="register-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名（3-20个字符）"
            prefix-icon="User"
            size="large"
            clearable
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item prop="nickname">
          <el-input
            v-model="registerForm.nickname"
            placeholder="请输入昵称（可选）"
            prefix-icon="Avatar"
            size="large"
            clearable
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（6-20个字符）"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleRegister"
            autocomplete="new-password"
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleRegister"
            autocomplete="new-password"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="register-button"
            @click="handleRegister"
            @mousedown="console.log('按钮被按下')"
            @touchstart.prevent="console.log('按钮被触摸')"
          >
            {{ loading ? '注册中...' : '立即注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <span>已有账号？</span>
        <router-link to="/login" class="link">立即登录</router-link>
      </div>

      <div class="tips">
        <el-alert
          title="温馨提示"
          type="info"
          :closable="false"
          show-icon
        >
          <p>• 用户名只能包含字母、数字和下划线</p>
          <p>• 密码长度为6-20个字符</p>
          <p>• 注册即代表您同意用户协议</p>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '@/api'

console.log('注册页面组件已加载')

const router = useRouter()
const registerFormRef = ref()
const loading = ref(false)

const registerForm = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

console.log('注册表单数据已初始化:', registerForm)

const validatePassword = (rule, value, callback) => {
  console.log('验证密码:', value)
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]+$/,
      message: '用户名只能包含字母、数字和下划线',
      trigger: 'blur'
    }
  ],
  nickname: [
    { max: 20, message: '昵称不能超过20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ]
}

console.log('验证规则已加载:', rules)

const handleRegister = async () => {
  console.log('=== 注册按钮被点击 ===')

  try {
    console.log('检查表单引用:', !!registerFormRef.value)
    console.log('表单数据:', registerForm)

    if (!registerFormRef.value) {
      console.error('表单引用不存在！')
      alert('表单引用不存在，请刷新页面重试')
      return
    }

    const valid = await registerFormRef.value.validate().catch((err) => {
      console.log('表单验证失败:', err)
      return false
    })

    if (!valid) {
      console.log('表单验证未通过，取消注册')
      return
    }

    console.log('表单验证通过，准备发送请求...')

    loading.value = true

    const { confirmPassword, ...data } = registerForm
    console.log('发送的数据:', data)

    const res = await register(data)

    console.log('注册响应:', res)
    ElMessage.success('注册成功！')
    router.push('/login')
  } catch (error) {
    console.error('=== 注册失败 ===')
    console.error('错误对象:', error)
    console.error('错误消息:', error.message)
    console.error('错误响应:', error.response)
    console.error('错误响应数据:', error.response?.data)

    const errorMsg = error.response?.data?.message || error.message || '注册失败，请稍后重试'
    ElMessage.error(errorMsg)
    alert('注册失败: ' + errorMsg)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('注册页面已挂载')
})
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-box {
  width: 100%;
  max-width: 450px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
  font-size: 14px;
}

.register-form {
  margin-bottom: 20px;
}

.register-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
}

.register-footer {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-top: 20px;
}

.link {
  color: #409eff;
  text-decoration: none;
  margin-left: 5px;
}

.link:hover {
  text-decoration: underline;
}

.tips {
  margin-top: 20px;
}

.tips p {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}
</style>
