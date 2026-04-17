# 清理浏览器数据指南

## 问题：页面仍然显示旧数据

这是因为浏览器缓存了旧的数据。需要按以下步骤彻底清理：

---

## 步骤 1：清除浏览器缓存和自动填充数据

### Chrome / Edge:

1. 按 **F12** 打开开发者工具
2. **右键点击**刷新按钮
3. 选择 **"清空缓存并硬性重新加载"**

或者：

1. 按 **Ctrl + Shift + Delete**
2. 选择 **"Cookie 和其他网站数据"** 和 **"缓存的图片和文件"**
3. 时间范围选择 **"全部时间"**
4. 点击 **"清除数据"**

### Firefox:

1. 按 **Ctrl + Shift + Delete**
2. 选择 **"Cookie"** 和 **"缓存"**
3. 时间范围选择 **"全部时间"**
4. 点击 **"立即清除"**

### Safari:

1. 在菜单中选择 **"开发"** → **"清空缓存"**
2. 或者使用快捷键 **Cmd + Option + E**

---

## 步骤 2：清除所有 localStorage 数据

在浏览器控制台（F12 → Console）执行以下命令：

### Chrome / Edge / Firefox:

```javascript
// 清除所有 localStorage 数据
localStorage.clear()
console.log('✅ localStorage 已清空')
```

### 手动清除特定项目（可选）:

```javascript
// 查看所有 localStorage 项目
Object.keys(localStorage).forEach(key => {
  console.log(key, localStorage.getItem(key))
})

// 删除特定项目
localStorage.removeItem('practiceHistory')
localStorage.removeItem('reviewRecords')
localStorage.removeItem('notebook')
localStorage.removeItem('reviewContinuous')
localStorage.removeItem('token')
localStorage.removeItem('userInfo')
console.log('✅ 特定 localStorage 项目已删除')
```

---

## 步骤 3：清除浏览器表单自动填充

### Chrome / Edge:

1. 点击地址栏左侧的锁图标
2. 找到 **"保存的密码"** 部分
3. 点击 **"显示密码"**
4. 找到要清除的项目并删除
5. 或者点击 **"移除"** 删除

### Firefox:

1. 点击地址栏右侧的锁图标
2. 找到 **"已保存的登录信息"**
3. 找到对应的网站并点击 **"删除"**

---

## 步骤 4：访问测试页面验证

```
http://localhost:3000/test-data
```

点击 **"执行注册测试"**，所有数据应该都是 0。

---

## 步骤 5：完全重启浏览器（如果上述方法无效）

1. 关闭所有浏览器窗口
2. 重新打开浏览器
3. 重新访问 `http://localhost:3000`

---

## 常见问题

### Q: 清空缓存后，还是显示旧数据？

A: 请执行步骤 2，在控制台执行 `localStorage.clear()`，然后刷新页面。

### Q: 为什么注册页面有默认值？

A: 这是浏览器的**自动填充功能**导致的。我已经添加了 `autocomplete="off"` 和 `autocomplete="new-password"` 属性，但需要清除浏览器的自动填充数据才能生效。

### Q: 如何永久解决自动填充问题？

A: 使用不同的浏览器，或者设置浏览器不保存密码。

---

## 验证清理是否成功

在浏览器控制台执行：

```javascript
// 应该返回 0 或空对象
console.log('localStorage 内容:', JSON.stringify(localStorage))
```

如果返回空对象 `{}`，说明清理成功！
