<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-header">
        <span class="logo">📚</span>
        <h2>考研智能刷题系统</h2>
        <p>科学备考 · 高效提分</p>
      </div>

      <el-form :model="loginForm" class="login-form">
        <el-form-item>
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            prefix-icon="User"
            size="large"
            :disabled="loading"
            autocomplete="off"
          />
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
            :disabled="loading"
            autocomplete="new-password"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            @click="handleLogin"
            :loading="loading"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span>还没有账号？</span>
        <router-link to="/register" class="link">立即注册</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    // 只调用后端 API
    await userStore.login(loginForm)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (error) {
    ElMessage.error('登录失败，请检查用户名和密码')
    console.error('登录错误:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .login-card {
    width: 420px;
    padding: 40px 30px;

    .login-header {
      text-align: center;
      margin-bottom: 30px;

      .logo {
        font-size: 48px;
      }

      h2 {
        color: #333;
        margin: 10px 0 5px;
      }

      p {
        color: #999;
        font-size: 14px;
      }
    }

    .login-footer {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 20px;

      .link {
        color: #409eff;
        text-decoration: none;
        margin-left: 5px;
      }

      .link:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
