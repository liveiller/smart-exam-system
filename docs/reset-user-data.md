# 重置用户数据说明

## 问题：新用户数据不是0

这是因为浏览器缓存了旧的模拟数据。需要执行以下步骤：

## 解决方案

### 步骤 1：清空数据库中的所有用户数据

```bash
# 连接到 MySQL
mysql -u root -p smart_exam

# 执行清空脚本
source /home/io/smart-exam-system/backend/database/reset_all_data.sql
```

或者在命令行中：

```bash
mysql -u root -p smart_exam < /home/io/smart-exam-system/backend/database/reset_all_data.sql
```

### 步骤 2：清除浏览器缓存

#### Chrome/Edge:
1. 按 **F12** 打开开发者工具
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

或者：
1. 按 **Ctrl+Shift+Delete**
2. 选择"缓存的图片和文件"
3. 点击"清除数据"

#### Firefox:
1. 按 **Ctrl+Shift+Delete**
2. 选择"缓存"
3. 点击"立即清除"

#### Safari:
1. 在菜单中选择"开发" > "清空缓存"
2. 或者使用快捷键 **Cmd+Option+E**

### 步骤 3：注册新用户并测试

1. 访问 `http://localhost:3000/register`
2. **不要**填写任何默认值（注册页面已移除默认值）
3. 输入新的用户名和密码
4. 注册后登录
5. 检查仪表盘数据是否都是 0

### 步骤 4：验证数据

```sql
-- 检查用户的各项数据
SELECT
  u.id,
  u.username,
  (SELECT COUNT(*) FROM practice_records WHERE user_id = u.id) as practice_count,
  (SELECT COUNT(*) FROM review_records WHERE user_id = u.id) as review_count,
  (SELECT COUNT(*) FROM notebook WHERE user_id = u.id) as notebook_count,
  (SELECT continuous_days FROM review_continuous WHERE user_id = u.id) as continuous_days,
  (SELECT SUM(correct_count) FROM review_records WHERE user_id = u.id) as total_correct
FROM users u
ORDER BY u.id DESC
LIMIT 5;
```

所有新用户的这些数据应该都是 0。

## 自动化解决方案

### 注册时自动初始化数据

系统已配置：当用户注册成功时，会自动：
1. 删除该用户的所有旧数据
2. 插入空的记录（practice_records, review_continuous）
3. 插入空的复习记录（review_records）
4. 清空错题本（notebook）

### 代码修改位置

1. **后端注册逻辑**：`backend/src/controllers/authController.js`
   - `exports.register` 函数中的初始化代码

2. **前端仪表盘**：`frontend/src/views/dashboard/index.vue`
   - 移除了 localStorage 的旧数据读取
   - 所有统计数据初始化为 0

## 常见问题

### Q1: 清空数据库后，为什么数据还是不是0？

A: 必须同时清除浏览器缓存，否则前端会显示旧的 localStorage 数据。

### Q2: 如何确保所有用户都是新用户？

A: 执行 `reset_all_data.sql` 清空所有用户数据，然后要求所有用户重新注册。

### Q3: 数据初始化失败怎么办？

A: 手动检查数据库中的外键约束是否正确设置。
