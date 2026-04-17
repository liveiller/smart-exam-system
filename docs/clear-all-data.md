# 清理所有数据指南

## 问题：靶向分析页面和智能复习页面数据不干净

这是因为这些页面使用了 localStorage 中的模拟数据。

---

## 解决方案：清除所有 localStorage 数据

### 方法 1：浏览器控制台执行（推荐）

1. 在页面按 **F12** 打开开发者工具
2. 点击顶部的 **"Console"** 标签
3. 输入以下命令并回车：

```javascript
// 清除所有 localStorage 数据
localStorage.clear()
console.log('✅ localStorage 已清空')
```

4. 刷新页面（F5）

---

### 方法 2：地址栏执行（最简单）

在浏览器地址栏输入并回车：

```
javascript:localStorage.clear()
```

页面会自动刷新并清空所有数据。

---

### 方法 3：一键清理所有

在地址栏输入并回车：

```
javascript:location.reload();localStorage.clear()
```

这条命令会：
1. 清除所有 localStorage 数据
2. 刷新页面

---

## 清理后验证

### 1. 访问靶向分析页面

```
http://localhost:3000/analysis
```

所有数据应该都是 **0**：
- 整体掌握率: 0%
- 总题数: 0
- 答对题数: 0
- 答错题数: 0
- 薄弱知识点: 0 个

### 2. 访问智能复习页面

```
http://localhost:3000/review
```

所有数据应该都是 **0**：
- 今日待复习: 0
- 今日已完成: 0
- 连续复习天数: 1
- 平均记忆保持率: 0%

---

## 如果还有问题

### 检查 localStorage 内容

在控制台输入：

```javascript
console.log('localStorage 内容:', localStorage)
```

应该返回 `{}`（空对象）。

### 手动删除特定项目

```javascript
// 删除特定项目
localStorage.removeItem('practiceHistory')
localStorage.removeItem('notebook')
localStorage.removeItem('reviewRecords')
localStorage.removeItem('token')
localStorage.removeItem('userInfo')
localStorage.removeItem('currentPractice')
localStorage.removeItem('currentReviewTasks')
localStorage.removeItem('reviewContinuous')
console.log('✅ 特定 localStorage 项目已删除')
```

---

## 已修复的文件

1. ✅ `frontend/src/utils/analysis.js` - 移除模拟数据初始化
2. ✅ `frontend/src/views/analysis/index.vue` - 改为从后端获取数据
3. ✅ `frontend/src/views/review/index.vue` - 改为从后端获取数据
4. ✅ `frontend/src/store/modules/notebook.js` - 移除 localStorage 后备
5. ✅ `frontend/src/views/review/Doing.vue` - 改为使用后端 API

---

## 完成后测试

1. 清除 localStorage（按上述方法）
2. 刷新所有页面
3. 访问靶向分析页面
4. 访问智能复习页面

所有数据应该都是 **0**。
