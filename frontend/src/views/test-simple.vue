<template>
  <div>
    <h1>测试页面</h1>
    <p>如果你能看到这个页面，说明前端工作正常</p>
    <button @click="testClick">点击测试</button>
    <p>点击次数: {{ clickCount }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const clickCount = ref(0)

const testClick = () => {
  console.log('=== 按钮被点击 ===')
  clickCount.value++
  console.log('点击次数:', clickCount.value)
  alert('点击成功！次数: ' + clickCount.value)
}
</script>
